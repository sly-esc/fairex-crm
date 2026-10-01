-- FAIREX Business OS / 5H.2A: only structural support for excluded-message skips.
-- No historical buffer rows are updated and no existing RPC is replaced.

ALTER TABLE public.n8n_message_buffer
  ADD COLUMN skipped_at timestamptz;

ALTER TABLE public.n8n_message_buffer
  DROP CONSTRAINT n8n_message_buffer_status_check;

ALTER TABLE public.n8n_message_buffer
  DROP CONSTRAINT n8n_message_buffer_state_check;

ALTER TABLE public.n8n_message_buffer
  ADD CONSTRAINT n8n_message_buffer_status_check
  CHECK (status IN ('pending', 'processing', 'processed', 'skipped'));

ALTER TABLE public.n8n_message_buffer
  ADD CONSTRAINT n8n_message_buffer_state_check
  CHECK (
    (status = 'pending'
       AND claim_token IS NULL AND claimed_at IS NULL
       AND processed_at IS NULL AND skipped_at IS NULL)
    OR
    (status = 'processing'
       AND claim_token IS NOT NULL AND claimed_at IS NOT NULL
       AND processed_at IS NULL AND skipped_at IS NULL)
    OR
    (status = 'processed'
       AND claim_token IS NOT NULL AND claimed_at IS NOT NULL
       AND processed_at IS NOT NULL AND skipped_at IS NULL)
    OR
    (status = 'skipped'
       AND claim_token IS NULL AND claimed_at IS NULL
       AND processed_at IS NULL AND skipped_at IS NOT NULL)
  );

CREATE FUNCTION public.rpc_skip_excluded_message(
  p_company_id bigint,
  p_session_key text,
  p_buffer_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_lead record;
  v_has_lead boolean := false;
  v_current_status text;
  v_updated_count integer;
BEGIN
  IF p_company_id IS NULL OR p_company_id <= 0 THEN
    RAISE EXCEPTION 'company_id invalido';
  END IF;

  IF p_buffer_id IS NULL OR p_buffer_id <= 0 THEN
    RAISE EXCEPTION 'buffer_id invalido';
  END IF;

  IF p_session_key IS NULL
     OR p_session_key !~ '^[1-9][0-9]*:[0-9]+$'
     OR split_part(p_session_key, ':', 1)::bigint <> p_company_id THEN
    RAISE EXCEPTION 'session_key invalida para company_id';
  END IF;

  -- Share-lock current matching leads so an ACTIVO/EXCLUIR change
  -- cannot interleave with this transaction's eligibility check.
  FOR v_lead IN
    SELECT l.estado
    FROM public.lead_memory AS l
    WHERE l.company_id = p_company_id
      AND l.numero = split_part(p_session_key, ':', 2)
    ORDER BY l.id
    FOR SHARE
  LOOP
    v_has_lead := true;
    IF v_lead.estado IS DISTINCT FROM 'EXCLUIR' THEN
      RAISE EXCEPTION 'Contacto no exclusivamente excluido';
    END IF;
  END LOOP;

  IF NOT v_has_lead THEN
    RAISE EXCEPTION 'Contacto no encontrado para company_id y session_key';
  END IF;

  -- Row lock prevents changing a message that was claimed concurrently.
  SELECT b.status
  INTO v_current_status
  FROM public.n8n_message_buffer AS b
  WHERE b.id = p_buffer_id
    AND b.company_id = p_company_id
    AND b.session_key = p_session_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mensaje no encontrado para company_id y session_key';
  END IF;

  IF v_current_status <> 'pending' THEN
    RETURN false;
  END IF;

  UPDATE public.n8n_message_buffer AS b
  SET status = 'skipped',
      skipped_at = now()
  WHERE b.id = p_buffer_id
    AND b.company_id = p_company_id
    AND b.session_key = p_session_key
    AND b.status = 'pending';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count = 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_skip_excluded_message(bigint, text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_skip_excluded_message(bigint, text, bigint)
  TO service_role;
