import { useEffect, useState, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { graphService } from '../services/graphService'
import * as d3 from 'd3-force'
import toast from 'react-hot-toast'

export default function Graph() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const containerRef = useRef(null)
    const graphRef = useRef()

    // Highlighting state
    const [highlightNodes, setHighlightNodes] = useState(new Set())
    const [highlightLinks, setHighlightLinks] = useState(new Set())
    const [hoverNode, setHoverNode] = useState(null)

    useEffect(() => {
        graphService.getGraphData()
            .then(res => setGraphData(res.data.data))
            .catch(() => toast.error('Failed to load knowledge graph'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                })
            }
        }
        window.addEventListener('resize', updateDimensions)
        updateDimensions()
        // Wait a tick for CSS to settle
        const timer = setTimeout(updateDimensions, 100)
        return () => {
            window.removeEventListener('resize', updateDimensions)
            clearTimeout(timer)
        }
    }, [])

    // Tweak d3 forces to look beautiful and spread out
    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.d3Force('charge').strength(-200).distanceMax(300)
            graphRef.current.d3Force('link').distance(70)
            graphRef.current.d3Force('collide', d3.forceCollide().radius(n => Math.sqrt(n.val) * 4))
        }
    }, [graphData])

    const handleNodeHover = useCallback((node) => {
        setHighlightNodes(new Set())
        setHighlightLinks(new Set())

        if (node) {
            const hNodes = new Set()
            const hLinks = new Set()
            hNodes.add(node.id)

            graphData.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                const targetId = typeof link.target === 'object' ? link.target.id : link.target

                if (sourceId === node.id) {
                    hLinks.add(link)
                    hNodes.add(targetId)
                }
                if (targetId === node.id) {
                    hLinks.add(link)
                    hNodes.add(sourceId)
                }
            })

            setHighlightNodes(hNodes)
            setHighlightLinks(hLinks)
        }

        setHoverNode(node || null)
    }, [graphData])

    const paintNode = useCallback((node, ctx, globalScale) => {
        const isHovered = hoverNode && hoverNode.id === node.id
        const isLinked = highlightNodes.has(node.id)
        const isTag = node.group === 'tag'

        ctx.beginPath()

        // Size base
        const radius = isTag ? Math.max(3, Math.sqrt(node.val)) : 3

        // Colors
        ctx.fillStyle = isTag
            ? (isHovered || isLinked ? '#fbbf24' : '#d97706') // Gold/Amber tags
            : (isHovered || isLinked ? '#fff' : '#94a3b8')    // Notes: white focus, slate default

        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
        ctx.fill()

        // Draw ring if selected/hovered
        if (isHovered || isLinked) {
            ctx.strokeStyle = isTag ? '#fcd34d' : '#e2e8f0'
            ctx.lineWidth = 1 / globalScale
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false)
            ctx.stroke()
        }

        // Labels
        if (isHovered || (isLinked && globalScale > 1.2) || globalScale > 2) {
            const label = node.name
            const fontSize = isHovered ? 14 / globalScale : 12 / globalScale
            ctx.font = `${fontSize}px Inter, sans-serif`
            ctx.fillStyle = '#f8fafc'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            // Text stroke (bg)
            ctx.lineWidth = 3 / globalScale
            ctx.strokeStyle = '#020617'
            ctx.strokeText(label, node.x, node.y + radius + (8 / globalScale))
            ctx.fillText(label, node.x, node.y + radius + (8 / globalScale))
        }
    }, [highlightNodes, hoverNode])

    return (
        <div className="animate-in h-[calc(100vh-6rem)] flex flex-col space-y-4">
            <div>
                <h1 className="font-serif text-3xl text-ink">Knowledge Graph</h1>
                <p className="text-sm text-ink-faint mt-1">
                    Visualizing the cosmic connections of your second brain. Hover to explore.
                </p>
            </div>

            <div
                ref={containerRef}
                className="flex-1 w-full bg-surface-2 rounded-2xl border border-border overflow-hidden relative shadow-inner"
            >
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-ink-ghost font-mono text-sm animate-pulse">Loading vectors...</span>
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeRelSize={4}
                        nodeCanvasObject={paintNode}
                        onNodeHover={handleNodeHover}
                        linkColor={link => highlightLinks.has(link) ? '#475569' : '#1e293b'}
                        linkWidth={link => highlightLinks.has(link) ? 2 : 1}
                        linkDirectionalParticles={link => highlightLinks.has(link) ? 3 : 0}
                        linkDirectionalParticleWidth={2}
                        linkDirectionalParticleSpeed={0.01}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        cooldownTicks={100}
                        backgroundColor="#020617" // Deep space slate
                    />
                )}

                {graphData.nodes.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                        <span className="text-4xl block mb-2 opacity-50">🕸️</span>
                        <p className="text-ink-faint text-sm max-w-sm">
                            Your graph is currently empty. Start taking notes and adding tags to build your network!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
