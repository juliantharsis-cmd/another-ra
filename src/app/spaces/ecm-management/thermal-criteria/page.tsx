'use client'

import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { thermalCriteriaConfig } from '@/components/templates/configs/thermalCriteriaConfig'

export default function ThermalCriteriaPage() {
  return <ListDetailTemplate config={thermalCriteriaConfig} />
}
