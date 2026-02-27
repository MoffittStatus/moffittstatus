'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Box, Globe, Rocket } from "lucide-react"
import { Experience } from '../components/Experience'

export default function Page() {

  const assets = [
    { 
      id: 'cube', 
      label: 'Standard Cube', 
      icon: <Box className="w-6 h-6 mb-2" /> 
    },
    { 
      id: 'kresge_top', 
      label: 'Mystery Sphere', 
      icon: <Globe className="w-6 h-6 mb-2" />
    },
    { 
      id: 'kresge_bottom', 
      label: 'Torus Knot', 
      icon: <Rocket className="w-6 h-6 mb-2" /> 
    },
  ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-slate-100">
      
    </main>
  )
}