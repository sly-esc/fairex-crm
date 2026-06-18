'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, Clock, CheckCircle2, Circle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

export default function TasksPage() {
  const { tasks, toggleTask, addTask, _hasHydrated } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')

  if (!_hasHydrated) return null

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !newTaskDate || !newTaskTime) return
    
    const dueDateString = `${newTaskDate}, ${newTaskTime}`

    addTask({
      title: newTaskTitle,
      leadName: 'Tarea Manual',
      dueDate: dueDateString,
      priority: newTaskPriority,
      completed: false,
      type: 'followup'
    })
    
    setNewTaskTitle('')
    setNewTaskDate('')
    setNewTaskTime('')
    setNewTaskPriority('medium')
    setIsAdding(false)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.leadName.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    if (filter === 'completed') return task.completed
    if (filter === 'today') return !task.completed && task.dueDate.includes('Hoy')
    if (filter === 'upcoming') return !task.completed && !task.dueDate.includes('Hoy')
    return true
  }).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Mis Tareas</h1>
          <p className="text-zinc-400">Gestiona tus seguimientos manuales y reuniones pendientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar tarea..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white rounded-full focus-visible:ring-primary/50"
            />
          </div>
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
          >
            <Plus className="h-4 w-4 mr-1" /> Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto hide-scrollbar">
        <Button 
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'secondary' : 'ghost'} 
          className={`rounded-full shrink-0 ${filter === 'all' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Todas
        </Button>
        <Button 
          onClick={() => setFilter('today')}
          variant={filter === 'today' ? 'secondary' : 'ghost'} 
          className={`rounded-full shrink-0 ${filter === 'today' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Hoy
        </Button>
        <Button 
          onClick={() => setFilter('upcoming')}
          variant={filter === 'upcoming' ? 'secondary' : 'ghost'} 
          className={`rounded-full shrink-0 ${filter === 'upcoming' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Próximas
        </Button>
        <Button 
          onClick={() => setFilter('completed')}
          variant={filter === 'completed' ? 'secondary' : 'ghost'} 
          className={`rounded-full shrink-0 ${filter === 'completed' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Completadas
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3 mt-4">
        
        {/* Inline Add Task Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAddTask} className="flex flex-col gap-4 p-5 mb-6 bg-primary/10 border border-primary/20 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">Nueva Tarea</h3>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-white h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Nombre de la tarea</label>
                    <Input 
                      autoFocus
                      placeholder="Ej. Llamar a prospecto..." 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="bg-black/50 border-white/10 text-white"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Fecha</label>
                      <Input 
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="bg-black/50 border-white/10 text-white"
                        required
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Hora</label>
                      <Input 
                        type="time"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="bg-black/50 border-white/10 text-white"
                        required
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Prioridad</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                        required
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/90 font-medium px-6 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
                    Guardar Tarea
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-zinc-500">
              No hay tareas en esta categoría.
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={task.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                  task.completed 
                    ? 'bg-black/20 border-white/5 opacity-50' 
                    : 'bg-black/40 border-white/10 hover:border-primary/30 backdrop-blur-xl shadow-lg hover:shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_10%,transparent)]'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 sm:mt-0 shrink-0 transition-colors ${task.completed ? 'text-primary' : 'text-zinc-500 hover:text-primary'}`}
                  >
                    {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </button>
                  
                  <div>
                    <h3 className={`font-semibold text-lg transition-colors ${task.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                      <span className="flex items-center gap-2 text-zinc-300 font-medium">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {task.leadName.split(' ').map(n=>n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {task.leadName}
                      </span>
                      <span className="text-zinc-700 hidden sm:inline">•</span>
                      <span className={`flex items-center gap-1.5 font-medium ${task.completed ? 'text-zinc-500' : task.dueDate.includes('Ayer') ? 'text-red-400' : 'text-emerald-400'}`}>
                        <Clock className="h-3.5 w-3.5" /> {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:ml-auto pl-10 sm:pl-0 shrink-0">
                  <Badge className={`font-medium tracking-wide ${
                    task.completed ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                    task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
