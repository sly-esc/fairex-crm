import { getCompanyDetail } from "@/actions/superadmin/companies";
import { notFound } from "next/navigation";
import CompanyDetailClient from "./CompanyDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  // En Next.js 15, params es una Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { success, data, error } = await getCompanyDetail(id);

  if (!success || !data) {
    console.error(`[CompanyDetailPage] Could not load company id=${id}. Error: ${error}`);
    notFound();
  }

  const { company_settings, company_modules, company_integrations, ...company } = data;

  // Extraer ai_config de company_settings, asumiendo un solo setting por empresa
  const aiConfig = company_settings && company_settings.length > 0 
    ? {
        ai_identity: company_settings[0].ai_identity,
        ai_business_rules: company_settings[0].ai_business_rules,
        ai_commercial_style: company_settings[0].ai_commercial_style,
        ai_constraints: company_settings[0].ai_constraints,
        ai_knowledge_sources: company_settings[0].ai_knowledge_sources,
      } 
    : {};

  return (
    <CompanyDetailClient 
      company={company} 
      modules={company_modules || []} 
      integrations={company_integrations || []} 
      aiConfig={aiConfig} 
      adminAccessStatus={company.adminAccessStatus}
    />
  );
}
