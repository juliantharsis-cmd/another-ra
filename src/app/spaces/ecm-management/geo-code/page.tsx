'use client'

import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { geoCodeConfig } from '@/components/templates/configs/geoCodeConfig'

export default function GeoCodePage() {
  return <ListDetailTemplate config={geoCodeConfig} />
}
