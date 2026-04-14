'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, QrCode, ArrowRight, Clock, Route } from "lucide-react"
import { createSampleGraph, findPathDijkstra, type Node, type Graph } from '@/lib/pathfinding'
import { getCurrentLocation } from '@/lib/utils'

export default function NavigationPage() {
  const searchParams = useSearchParams()
  const [graph] = useState<Graph>(createSampleGraph())
  const [currentLocation, setCurrentLocation] = useState<Node | null>(null)
  const [destination, setDestination] = useState<Node | null>(null)
  const [path, setPath] = useState<Node[]>([])
  const [totalDistance, setTotalDistance] = useState<number>(0)
  const [startFromQR, setStartFromQR] = useState(false)

  // Parse URL parameters for QR code navigation
  useEffect(() => {
    const startParam = searchParams.get('start')
    const goalParam = searchParams.get('goal')

    setStartFromQR(false)

    if (startParam) {
      const startNode = graph.nodes.get(startParam)
      if (startNode) {
        setCurrentLocation(startNode)
        setStartFromQR(true)
      }
    }

    if (goalParam) {
      const goalNode = graph.nodes.get(goalParam)
      if (goalNode) setDestination(goalNode)
    }
  }, [searchParams, graph])

  // Calculate path when both locations are set
  useEffect(() => {
    if (currentLocation && destination) {
      const result = findPathDijkstra(graph, currentLocation.id, destination.id)
      if (result.found) {
        setPath(result.path)
        setTotalDistance(result.totalDistance)
      } else {
        setPath([])
        setTotalDistance(0)
      }
    }
  }, [currentLocation, destination, graph])

  const handleUseCurrentLocation = async () => {
    try {
      const geo = await getCurrentLocation()
      if (geo.lat !== -1) {
        // Convert GPS to library coordinates (you'll need to implement this mapping)
        // For now, just set to entrance
        const entrance = graph.nodes.get('entrance')
        if (entrance) setCurrentLocation(entrance)
      }
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }

  const availableDestinations = Array.from(graph.nodes.values()).filter(
    node => node.id !== currentLocation?.id
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Library Navigation
          </h1>
          <p className="text-gray-600">
            Find your way around the library using our interactive map
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Location */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Location
                </label>
                {currentLocation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{currentLocation.name || currentLocation.id}</span>
                    </div>
                    {startFromQR && (
                      <p className="text-xs text-blue-700">
                        Current location set from scanned QR code.
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleUseCurrentLocation}
                    variant="outline"
                    className="w-full"
                  >
                    Use Current Location
                  </Button>
                )}
              </div>

              {/* Destination Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Destination
                </label>
                <select
                  value={destination?.id || ''}
                  onChange={(e) => {
                    const node = graph.nodes.get(e.target.value)
                    if (node) setDestination(node)
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select destination...</option>
                  {availableDestinations.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.name || node.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* QR Code Info */}
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">QR Code Navigation</span>
                </div>
                <p className="text-sm text-blue-700">
                  Scan QR codes at library entrances and key locations to set your starting point automatically.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Example: <code>/navigation?start=entrance</code> will treat the scanned QR location as your current position.
                </p>
              </div>

              {/* Path Display */}
              {path.length > 0 && (
                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Path Found:</h4>
                  <div className="text-sm space-y-1">
                    {path.map((node, index) => (
                      <div key={node.id} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span>{node.name || node.id}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-3"
                  >
                    Start Navigation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GPS-Style Map View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Route Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {path.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple Map Visualization */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-center">Route Map</h4>
                    <div className="flex items-center justify-center space-x-2 overflow-x-auto">
                      {path.map((node, index) => (
                        <div key={node.id} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? 'bg-green-500 text-white'
                              : index === path.length - 1
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}>
                            {index === 0 ? 'S' : index === path.length - 1 ? 'E' : index}
                          </div>
                          {index < path.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      S = Start, E = End
                    </div>
                  </div>

                  {/* Turn-by-Turn Directions */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Directions</h4>
                    {path.map((node, index) => (
                      <div key={node.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          index === 0
                            ? 'bg-green-500 text-white'
                            : index === path.length - 1
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{node.name || node.id}</div>
                          {index < path.length - 1 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Continue straight to {path[index + 1].name || path[index + 1].id}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Select a destination to view your route</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}