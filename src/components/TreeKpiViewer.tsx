import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  DollarSign, 
  Calendar, 
  Layers, 
  Box, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  ZoomIn, 
  ZoomOut, 
  Droplets, 
  PackageX, 
  Truck, 
  AlertTriangle, 
  CalendarClock, 
  ShieldAlert, 
  Wrench, 
  HelpCircle,
  Award,
  TrendingDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  BarChart3,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Settings,
  Zap,
  Clock,
  LayoutGrid,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Move
} from 'lucide-react';
import { Usuario, QuebraRow } from '../types';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { CustomKpiTree, CustomTreeNode, CustomTreeNodeRecord } from '../types/treeKpiTypes';
import { DEFAULT_OFFICIAL_KPI_TREE } from '../data/defaultKpiTreeData';
import { ManualNodeEditModal } from './tree-kpi/ManualNodeEditModal';
import { ManualTreeSettingsModal } from './tree-kpi/ManualTreeSettingsModal';

interface TreeKpiViewerProps {
  user?: Usuario;
  quebras?: QuebraRow[];
  onClose?: () => void;
  isModal?: boolean;
}

// Icon mapper helper
function renderNodeIcon(iconName?: string, fallback = AlertTriangle) {
  switch (iconName) {
    case 'flame': return <Flame className="w-3.5 h-3.5 text-amber-600" />;
    case 'droplet': return <Droplets className="w-3.5 h-3.5 text-sky-600" />;
    case 'shield-alert': return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
    case 'package-x': return <PackageX className="w-3.5 h-3.5 text-rose-600" />;
    case 'truck': return <Truck className="w-3.5 h-3.5 text-blue-600" />;
    case 'clock': case 'calendar-clock': return <CalendarClock className="w-3.5 h-3.5 text-purple-600" />;
    case 'calendar': return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
    case 'box': return <Box className="w-3.5 h-3.5 text-sky-600" />;
    case 'zap': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    case 'award': return <Award className="w-3.5 h-3.5 text-emerald-600" />;
    case 'dollar': return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
    case 'alert-triangle': default: return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  }
}

export default function TreeKpiViewer({
  user,
  quebras,
  onClose,
  isModal = false
}: TreeKpiViewerProps) {
  // ── APP & DATA PERSISTENCE MODE ──
  const [activeMode, setActiveMode] = useState<'automatic' | 'manual'>('manual');
  const [customTrees, setCustomTrees] = useState<CustomKpiTree[]>(() => {
    try {
      // Clear legacy storage keys
      localStorage.removeItem('custom_kpi_trees_v1');
      const saved = localStorage.getItem('custom_kpi_trees_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isLegacy = parsed.some(t => 
            t.totalValue === 42017.10 || 
            t.name?.includes('Perdas') ||
            t.title?.includes('PERDAS') ||
            (t.nodes?.level2 && t.nodes.level2.some((n: any) => n.id === 'm-jan' || n.label === 'Vazamento'))
          );
          if (!isLegacy) return parsed;
        }
      }
    } catch {}
    return [DEFAULT_OFFICIAL_KPI_TREE];
  });
  const [activeTreeId, setActiveTreeId] = useState<string>(customTrees[0]?.id || DEFAULT_OFFICIAL_KPI_TREE.id);

  // Sync custom trees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('custom_kpi_trees_v3', JSON.stringify(customTrees));
    } catch {}
  }, [customTrees]);

  const activeCustomTree = useMemo(() => {
    return customTrees.find(t => t.id === activeTreeId) || customTrees[0] || DEFAULT_OFFICIAL_KPI_TREE;
  }, [customTrees, activeTreeId]);

  // ── DISPLAY CONTROLS ──
  const [metricMode, setMetricMode] = useState<'valor' | 'quantidade'>('valor');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isModal);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // ── SELECTION STATE FOR 7 LEVELS ──
  const [selectedL2Id, setSelectedL2Id] = useState<string>('');
  const [selectedL3Id, setSelectedL3Id] = useState<string>('');
  const [selectedL4Id, setSelectedL4Id] = useState<string>('');
  const [selectedL5Id, setSelectedL5Id] = useState<string>('');
  const [selectedL6Id, setSelectedL6Id] = useState<string>('');

  // ── MODAL STATES FOR MANUAL BUILDING ──
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [editNodeModal, setEditNodeModal] = useState<{
    isOpen: boolean;
    levelNumber: number;
    levelTitle: string;
    node: CustomTreeNode | null;
    parentId?: string;
    availableParents?: Array<{ id: string; label: string }>;
  }>({
    isOpen: false,
    levelNumber: 2,
    levelTitle: '',
    node: null
  });

  // ── DRAG & DROP STATE FOR MOVING / REORDERING CARDS ──
  const [draggedNode, setDraggedNode] = useState<{
    level: number;
    parentId?: string;
    index: number;
    id: string;
  } | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<{
    level: number;
    parentId?: string;
    index: number;
  } | null>(null);

  // ── DOM REFS FOR CONNECTOR CALCULATION ──
  const containerRef = useRef<HTMLDivElement>(null);
  const rootCardRef = useRef<HTMLDivElement>(null);
  const l2CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l3CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l4CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l5CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l6CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l7CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const top10ContainerRef = useRef<HTMLDivElement | null>(null);

  const [svgPaths, setSvgPaths] = useState<Array<{ 
    id: string; 
    d: string; 
    gradientId: string;
    color: string; 
    strokeWidth?: number;
    opacity?: number;
    isCurrentActive?: boolean;
    startPoint: { x: number; y: number }; 
    endPoint: { x: number; y: number } 
  }>>([]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen && !isModal) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen, isModal]);

  // ── COMPUTE LIVE ACTIVE TREE DATA (MERGED OFFICIAL & CUSTOM) ──
  const treeData = useMemo(() => {
    return activeCustomTree;
  }, [activeCustomTree]);

  // Active level 2 nodes
  const l2Nodes = useMemo(() => {
    return treeData.nodes.level2 || [];
  }, [treeData]);

  // Keep Level 2 selection valid
  useEffect(() => {
    if (l2Nodes.length > 0) {
      if (!selectedL2Id || !l2Nodes.some(n => n.id === selectedL2Id)) {
        const critical = l2Nodes.find(n => n.isCritical) || l2Nodes[0];
        setSelectedL2Id(critical.id);
      }
    } else {
      setSelectedL2Id('');
    }
  }, [l2Nodes, selectedL2Id]);

  const activeL2Node = useMemo(() => {
    return l2Nodes.find(n => n.id === selectedL2Id) || l2Nodes[0] || null;
  }, [l2Nodes, selectedL2Id]);

  // Active level 3 nodes
  const l3Nodes = useMemo(() => {
    if (!activeL2Node) return [];
    const mapNodes = treeData.nodes.level3[activeL2Node.id] || [];
    return mapNodes;
  }, [treeData, activeL2Node]);

  // Keep Level 3 selection valid
  useEffect(() => {
    if (l3Nodes.length > 0) {
      if (!selectedL3Id || !l3Nodes.some(n => n.id === selectedL3Id)) {
        setSelectedL3Id(l3Nodes[0].id);
      }
    } else {
      setSelectedL3Id('');
    }
  }, [l3Nodes, selectedL3Id]);

  const activeL3Node = useMemo(() => {
    return l3Nodes.find(n => n.id === selectedL3Id) || l3Nodes[0] || null;
  }, [l3Nodes, selectedL3Id]);

  // Active level 4 nodes
  const l4Nodes = useMemo(() => {
    if (!activeL3Node) return [];
    const mapNodes = treeData.nodes.level4[activeL3Node.id] || [];
    return mapNodes;
  }, [treeData, activeL3Node]);

  // Keep Level 4 selection valid
  useEffect(() => {
    if (l4Nodes.length > 0) {
      if (!selectedL4Id || !l4Nodes.some(n => n.id === selectedL4Id)) {
        setSelectedL4Id(l4Nodes[0].id);
      }
    } else {
      setSelectedL4Id('');
    }
  }, [l4Nodes, selectedL4Id]);

  const activeL4Node = useMemo(() => {
    return l4Nodes.find(n => n.id === selectedL4Id) || l4Nodes[0] || null;
  }, [l4Nodes, selectedL4Id]);

  // Active level 5 nodes
  const l5Nodes = useMemo(() => {
    if (!activeL4Node) return [];
    const mapNodes = treeData.nodes.level5[activeL4Node.id] || [];
    return mapNodes;
  }, [treeData, activeL4Node]);

  // Keep Level 5 selection valid
  useEffect(() => {
    if (l5Nodes.length > 0) {
      if (!selectedL5Id || !l5Nodes.some(n => n.id === selectedL5Id)) {
        setSelectedL5Id(l5Nodes[0].id);
      }
    } else {
      setSelectedL5Id('');
    }
  }, [l5Nodes, selectedL5Id]);

  const activeL5Node = useMemo(() => {
    return l5Nodes.find(n => n.id === selectedL5Id) || l5Nodes[0] || null;
  }, [l5Nodes, selectedL5Id]);

  // Active level 6 nodes
  const l6Nodes = useMemo(() => {
    if (!activeL5Node) return [];
    const mapNodes = (treeData.nodes.level6 && treeData.nodes.level6[activeL5Node.id]) || [];
    return mapNodes;
  }, [treeData, activeL5Node]);

  // Keep Level 6 selection valid
  useEffect(() => {
    if (l6Nodes.length > 0) {
      if (!selectedL6Id || !l6Nodes.some(n => n.id === selectedL6Id)) {
        setSelectedL6Id(l6Nodes[0].id);
      }
    } else {
      setSelectedL6Id('');
    }
  }, [l6Nodes, selectedL6Id]);

  const activeL6Node = useMemo(() => {
    return l6Nodes.find(n => n.id === selectedL6Id) || l6Nodes[0] || null;
  }, [l6Nodes, selectedL6Id]);

  // Active level 7 nodes (Terminal items)
  const l7Nodes = useMemo(() => {
    if (!activeL6Node) return [];
    const mapNodes = (treeData.nodes.level7 && treeData.nodes.level7[activeL6Node.id]) || [];
    if (!searchTerm.trim()) return mapNodes;
    const term = searchTerm.toLowerCase();
    return mapNodes.filter(n => 
      n.label.toLowerCase().includes(term) || 
      (n.skuCode && n.skuCode.includes(term))
    );
  }, [treeData, activeL6Node, searchTerm]);

  // ── DYNAMIC SVG BEZIER CURVE CALCULATION ──
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const paths: typeof svgPaths = [];

    const zoom = zoomLevel / 100;

    // 1. Root Card -> ALL Level 2 Cards
    if (rootCardRef.current && l2Nodes.length > 0) {
      const rEl = rootCardRef.current;
      const rBox = rEl.getBoundingClientRect();
      const x1 = (rBox.right - cRect.left + containerRef.current.scrollLeft) / zoom;
      const y1 = (rBox.top + rBox.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

      l2Nodes.forEach(m => {
        const l2El = l2CardRefs.current[m.id];
        if (!l2El) return;
        const l2Box = l2El.getBoundingClientRect();
        const x2 = (l2Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y2 = (l2Box.top + l2Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        const isSelected = m.id === selectedL2Id;
        const isCrit = m.isCritical;
        const dx = (x2 - x1) * 0.55;
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        paths.push({
          id: `path-root-l2-${m.id}`,
          d,
          gradientId: isCrit ? 'grad-root-rose' : 'grad-root-blue',
          color: isCrit ? '#f43f5e' : (isSelected ? '#2563eb' : '#60a5fa'),
          strokeWidth: isSelected ? 3.4 : 2.2,
          opacity: isSelected ? 1 : 0.65,
          isCurrentActive: isSelected,
          startPoint: { x: x1, y: y1 },
          endPoint: { x: x2, y: y2 }
        });
      });
    }

    // 2. Selected Level 2 Card -> ALL Level 3 Cards
    if (selectedL2Id && l2CardRefs.current[selectedL2Id] && l3Nodes.length > 0) {
      const l2El = l2CardRefs.current[selectedL2Id];
      if (l2El) {
        const l2Box = l2El.getBoundingClientRect();
        const x1 = (l2Box.right - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y1 = (l2Box.top + l2Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        l3Nodes.forEach(mot => {
          const l3El = l3CardRefs.current[mot.id];
          if (!l3El) return;
          const l3Box = l3El.getBoundingClientRect();
          const x2 = (l3Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
          const y2 = (l3Box.top + l3Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

          const isSelected = mot.id === selectedL3Id;
          const dx = (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          paths.push({
            id: `path-l2-l3-${mot.id}`,
            d,
            gradientId: 'grad-month-amber',
            color: isSelected ? '#f59e0b' : '#fbbf24',
            strokeWidth: isSelected ? 3.4 : 2.2,
            opacity: isSelected ? 1 : 0.65,
            isCurrentActive: isSelected,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 }
          });
        });
      }
    }

    // 3. Selected Level 3 Card -> ALL Level 4 Cards
    if (selectedL3Id && l3CardRefs.current[selectedL3Id] && l4Nodes.length > 0) {
      const l3El = l3CardRefs.current[selectedL3Id];
      if (l3El) {
        const l3Box = l3El.getBoundingClientRect();
        const x1 = (l3Box.right - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y1 = (l3Box.top + l3Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        l4Nodes.forEach(pkg => {
          const l4El = l4CardRefs.current[pkg.id];
          if (!l4El) return;
          const l4Box = l4El.getBoundingClientRect();
          const x2 = (l4Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
          const y2 = (l4Box.top + l4Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

          const isSelected = pkg.id === selectedL4Id;
          const dx = (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          paths.push({
            id: `path-l3-l4-${pkg.id}`,
            d,
            gradientId: 'grad-motivo-sky',
            color: isSelected ? '#0ea5e9' : '#38bdf8',
            strokeWidth: isSelected ? 3.4 : 2.2,
            opacity: isSelected ? 1 : 0.65,
            isCurrentActive: isSelected,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 }
          });
        });
      }
    }

    // 4. Selected Level 4 Card -> ALL Level 5 Cards
    if (selectedL4Id && l4CardRefs.current[selectedL4Id] && l5Nodes.length > 0) {
      const l4El = l4CardRefs.current[selectedL4Id];
      if (l4El) {
        const l4Box = l4El.getBoundingClientRect();
        const x1 = (l4Box.right - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y1 = (l4Box.top + l4Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        l5Nodes.forEach(l5Item => {
          const l5El = l5CardRefs.current[l5Item.id];
          if (!l5El) return;
          const l5Box = l5El.getBoundingClientRect();
          const x2 = (l5Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
          const y2 = (l5Box.top + l5Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

          const isSelected = l5Item.id === selectedL5Id;
          const dx = (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          paths.push({
            id: `path-l4-l5-${l5Item.id}`,
            d,
            gradientId: 'grad-pkg-emerald',
            color: isSelected ? '#10b981' : '#34d399',
            strokeWidth: isSelected ? 3.4 : 2.2,
            opacity: isSelected ? 1 : 0.65,
            isCurrentActive: isSelected,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 }
          });
        });
      }
    }

    // 5. Selected Level 5 Card -> ALL Level 6 Cards
    if (selectedL5Id && l5CardRefs.current[selectedL5Id] && l6Nodes.length > 0) {
      const l5El = l5CardRefs.current[selectedL5Id];
      if (l5El) {
        const l5Box = l5El.getBoundingClientRect();
        const x1 = (l5Box.right - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y1 = (l5Box.top + l5Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        l6Nodes.forEach(l6Item => {
          const l6El = l6CardRefs.current[l6Item.id];
          if (!l6El) return;
          const l6Box = l6El.getBoundingClientRect();
          const x2 = (l6Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
          const y2 = (l6Box.top + l6Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

          const isSelected = l6Item.id === selectedL6Id;
          const dx = (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          paths.push({
            id: `path-l5-l6-${l6Item.id}`,
            d,
            gradientId: 'grad-l6-purple',
            color: isSelected ? '#9333ea' : '#c084fc',
            strokeWidth: isSelected ? 3.4 : 2.2,
            opacity: isSelected ? 1 : 0.65,
            isCurrentActive: isSelected,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 }
          });
        });
      }
    }

    // 6. Selected Level 6 Card -> ALL Level 7 Cards
    if (selectedL6Id && l6CardRefs.current[selectedL6Id] && l7Nodes.length > 0) {
      const l6El = l6CardRefs.current[selectedL6Id];
      if (l6El) {
        const l6Box = l6El.getBoundingClientRect();
        const x1 = (l6Box.right - cRect.left + containerRef.current.scrollLeft) / zoom;
        const y1 = (l6Box.top + l6Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

        l7Nodes.forEach(l7Item => {
          const l7El = l7CardRefs.current[l7Item.id];
          if (!l7El) return;
          const l7Box = l7El.getBoundingClientRect();
          const x2 = (l7Box.left - cRect.left + containerRef.current.scrollLeft) / zoom;
          const y2 = (l7Box.top + l7Box.height / 2 - cRect.top + containerRef.current.scrollTop) / zoom;

          const dx = (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          paths.push({
            id: `path-l6-l7-${l7Item.id}`,
            d,
            gradientId: 'grad-l7-rose',
            color: '#e11d48',
            strokeWidth: 2.2,
            opacity: 0.75,
            isCurrentActive: true,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 }
          });
        });
      }
    }

    setSvgPaths(paths);
  }, [l2Nodes, l3Nodes, l4Nodes, l5Nodes, l6Nodes, l7Nodes, selectedL2Id, selectedL3Id, selectedL4Id, selectedL5Id, selectedL6Id, zoomLevel]);

  // Recalculate on any resize or level change
  useEffect(() => {
    const timer = setTimeout(calculateConnectors, 60);
    window.addEventListener('resize', calculateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateConnectors);
    };
  }, [calculateConnectors, l2Nodes, l3Nodes, l4Nodes, l5Nodes, l6Nodes, l7Nodes, selectedL2Id, selectedL3Id, selectedL4Id, selectedL5Id, selectedL6Id, zoomLevel, treeData]);

  // ── MANUAL TREE OPERATIONS ──
  const handleReorderNode = (
    level: number,
    parentId: string | undefined,
    sourceIndex: number,
    targetIndex: number
  ) => {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) return;
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;

        const moveInArray = (arr: CustomTreeNode[]) => {
          if (!arr || sourceIndex >= arr.length || targetIndex >= arr.length) return arr;
          const [moved] = arr.splice(sourceIndex, 1);
          arr.splice(targetIndex, 0, moved);
          return arr;
        };

        if (level === 2) {
          newTree.nodes.level2 = moveInArray(newTree.nodes.level2);
        } else if (level === 3 && parentId) {
          if (newTree.nodes.level3[parentId]) {
            newTree.nodes.level3[parentId] = moveInArray(newTree.nodes.level3[parentId]);
          }
        } else if (level === 4 && parentId) {
          if (newTree.nodes.level4[parentId]) {
            newTree.nodes.level4[parentId] = moveInArray(newTree.nodes.level4[parentId]);
          }
        } else if (level === 5 && parentId) {
          if (newTree.nodes.level5[parentId]) {
            newTree.nodes.level5[parentId] = moveInArray(newTree.nodes.level5[parentId]);
          }
        } else if (level === 6 && parentId) {
          if (!newTree.nodes.level6) newTree.nodes.level6 = {};
          if (newTree.nodes.level6[parentId]) {
            newTree.nodes.level6[parentId] = moveInArray(newTree.nodes.level6[parentId]);
          }
        } else if (level === 7 && parentId) {
          if (!newTree.nodes.level7) newTree.nodes.level7 = {};
          if (newTree.nodes.level7[parentId]) {
            newTree.nodes.level7[parentId] = moveInArray(newTree.nodes.level7[parentId]);
          }
        }

        return newTree;
      });
    });
    setTimeout(calculateConnectors, 50);
  };

  const handleMoveNodeUp = (level: number, parentId: string | undefined, index: number) => {
    if (index <= 0) return;
    handleReorderNode(level, parentId, index, index - 1);
  };

  const handleMoveNodeDown = (level: number, parentId: string | undefined, index: number, maxLen: number) => {
    if (index >= maxLen - 1) return;
    handleReorderNode(level, parentId, index, index + 1);
  };

  const handleMoveNodeToParent = (
    oldParentId: string,
    newParentId: string,
    nodeId: string
  ) => {
    if (oldParentId === newParentId) return;
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;

        // Level 3
        if (newTree.nodes.level3[oldParentId]) {
          const idx = newTree.nodes.level3[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level3[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level3[newParentId]) newTree.nodes.level3[newParentId] = [];
            newTree.nodes.level3[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 4
        if (newTree.nodes.level4[oldParentId]) {
          const idx = newTree.nodes.level4[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level4[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level4[newParentId]) newTree.nodes.level4[newParentId] = [];
            newTree.nodes.level4[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 5
        if (newTree.nodes.level5[oldParentId]) {
          const idx = newTree.nodes.level5[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level5[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level5[newParentId]) newTree.nodes.level5[newParentId] = [];
            newTree.nodes.level5[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 6
        if (newTree.nodes.level6 && newTree.nodes.level6[oldParentId]) {
          const idx = newTree.nodes.level6[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level6[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level6[newParentId]) newTree.nodes.level6[newParentId] = [];
            newTree.nodes.level6[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 7
        if (newTree.nodes.level7 && newTree.nodes.level7[oldParentId]) {
          const idx = newTree.nodes.level7[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level7[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level7[newParentId]) newTree.nodes.level7[newParentId] = [];
            newTree.nodes.level7[newParentId].push(moved);
            return newTree;
          }
        }

        return newTree;
      });
    });
    setTimeout(calculateConnectors, 50);
  };

  const handleSaveNode = (updatedNode: CustomTreeNode) => {
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;
        const lvl = editNodeModal.levelNumber;

        if (lvl === 1) {
          newTree.nodes.level1 = updatedNode;
          newTree.totalValue = updatedNode.value;
          if (updatedNode.volume) newTree.totalVolume = updatedNode.volume;
        } else if (lvl === 2) {
          const idx = newTree.nodes.level2.findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level2[idx] = updatedNode;
          } else {
            newTree.nodes.level2.push(updatedNode);
          }
        } else if (lvl === 3 && activeL2Node) {
          const l2Id = editNodeModal.parentId || activeL2Node.id;
          if (!newTree.nodes.level3[l2Id]) newTree.nodes.level3[l2Id] = [];
          const idx = newTree.nodes.level3[l2Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level3[l2Id][idx] = updatedNode;
          } else {
            newTree.nodes.level3[l2Id].push(updatedNode);
          }
        } else if (lvl === 4 && activeL3Node) {
          const l3Id = editNodeModal.parentId || activeL3Node.id;
          if (!newTree.nodes.level4[l3Id]) newTree.nodes.level4[l3Id] = [];
          const idx = newTree.nodes.level4[l3Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level4[l3Id][idx] = updatedNode;
          } else {
            newTree.nodes.level4[l3Id].push(updatedNode);
          }
        } else if (lvl === 5 && activeL4Node) {
          const l4Id = editNodeModal.parentId || activeL4Node.id;
          if (!newTree.nodes.level5[l4Id]) newTree.nodes.level5[l4Id] = [];
          const idx = newTree.nodes.level5[l4Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level5[l4Id][idx] = updatedNode;
          } else {
            newTree.nodes.level5[l4Id].push(updatedNode);
          }
        } else if (lvl === 6 && activeL5Node) {
          if (!newTree.nodes.level6) newTree.nodes.level6 = {};
          const l5Id = editNodeModal.parentId || activeL5Node.id;
          if (!newTree.nodes.level6[l5Id]) newTree.nodes.level6[l5Id] = [];
          const idx = newTree.nodes.level6[l5Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level6[l5Id][idx] = updatedNode;
          } else {
            newTree.nodes.level6[l5Id].push(updatedNode);
          }
        } else if (lvl === 7 && activeL6Node) {
          if (!newTree.nodes.level7) newTree.nodes.level7 = {};
          const l6Id = editNodeModal.parentId || activeL6Node.id;
          if (!newTree.nodes.level7[l6Id]) newTree.nodes.level7[l6Id] = [];
          const idx = newTree.nodes.level7[l6Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level7[l6Id][idx] = updatedNode;
          } else {
            newTree.nodes.level7[l6Id].push(updatedNode);
          }
        }

        return newTree;
      });
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;
        const lvl = editNodeModal.levelNumber;

        if (lvl === 2) {
          newTree.nodes.level2 = newTree.nodes.level2.filter(n => n.id !== nodeId);
        } else if (lvl === 3 && activeL2Node) {
          const l2Id = activeL2Node.id;
          if (newTree.nodes.level3[l2Id]) {
            newTree.nodes.level3[l2Id] = newTree.nodes.level3[l2Id].filter(n => n.id !== nodeId);
          }
        } else if (lvl === 4 && activeL3Node) {
          const l3Id = activeL3Node.id;
          if (newTree.nodes.level4[l3Id]) {
            newTree.nodes.level4[l3Id] = newTree.nodes.level4[l3Id].filter(n => n.id !== nodeId);
          }
        } else if (lvl === 5 && activeL4Node) {
          const l4Id = activeL4Node.id;
          if (newTree.nodes.level5[l4Id]) {
            newTree.nodes.level5[l4Id] = newTree.nodes.level5[l4Id].filter(n => n.id !== nodeId);
          }
        } else if (lvl === 6 && activeL5Node) {
          const l5Id = activeL5Node.id;
          if (newTree.nodes.level6 && newTree.nodes.level6[l5Id]) {
            newTree.nodes.level6[l5Id] = newTree.nodes.level6[l5Id].filter(n => n.id !== nodeId);
          }
        } else if (lvl === 7 && activeL6Node) {
          const l6Id = activeL6Node.id;
          if (newTree.nodes.level7 && newTree.nodes.level7[l6Id]) {
            newTree.nodes.level7[l6Id] = newTree.nodes.level7[l6Id].filter(n => n.id !== nodeId);
          }
        }
        return newTree;
      });
    });
  };

  const handleCloneOfficial = () => {
    const cloned: CustomKpiTree = {
      ...JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_KPI_TREE)),
      id: `tree-custom-${Date.now()}`,
      name: `Árvore Personalizada (${customTrees.length + 1})`,
      title: 'ÁRVORE DE INDICADORES (PERSONALIZADA)'
    };
    setCustomTrees(prev => [...prev, cloned]);
    setActiveTreeId(cloned.id);
    setActiveMode('manual');
  };

  const handleCreateNewBlank = (name: string) => {
    const newBlank: CustomKpiTree = {
      id: `tree-blank-${Date.now()}`,
      name: name || 'Nova Árvore Personalizada',
      title: (name || 'Nova Árvore de Indicadores').toUpperCase(),
      subtitle: 'Árvore de KPI customizada com 7 níveis hierárquicos',
      badgeText: '7 NÍVEIS',
      unitName: 'unidades',
      currencySymbol: 'R$',
      totalValue: 0,
      totalVolume: 0,
      totalRegistros: 0,
      ticketMedio: 0,
      summaryTag: 'Estrutura personalizada ativa.',
      criticalHighlight: '',
      levels: {
        level1Title: 'ÁRVORE DE KPI',
        level1Badge: 'RAIZ',
        level2Title: 'NÍVEL 2 - CATEGORIAS',
        level2Badge: '0 CARDS',
        level3Title: 'NÍVEL 3 - SUB-RAMOS',
        level3Badge: '0 CARDS',
        level4Title: 'NÍVEL 4 - SEGMENTOS',
        level4Badge: '0 CARDS',
        level5Title: 'NÍVEL 5 - DETALHAMENTO',
        level5Badge: '0 CARDS',
        level6Title: 'NÍVEL 6 - OPERAÇÃO',
        level6Badge: '0 CARDS',
        level7Title: 'NÍVEL 7 - ITENS / SKUS',
        level7Badge: '0 ITENS',
      },
      nodes: {
        level1: {
          id: 'root',
          label: 'ARVORE DE KPI',
          sublabel: 'Modo Manual',
          value: 0,
          volume: 0,
          badge: 'Manual',
          metaInfo: 'Árvore criada pelo usuário'
        },
        level2: [],
        level3: {},
        level4: {},
        level5: {},
        level6: {},
        level7: {}
      }
    };
    setCustomTrees(prev => [...prev, newBlank]);
    setActiveTreeId(newBlank.id);
    setActiveMode('manual');
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    setTimeout(calculateConnectors, 60);
  };

  // Keyboard shortcut (Escape to exit fullscreen) and body scroll lock
  useEffect(() => {
    if (isFullscreen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
          setTimeout(calculateConnectors, 100);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen, calculateConnectors]);

  // Exact background style identical to platform's signature corporate light theme
  const platformGradientStyle: React.CSSProperties = {
    backgroundColor: '#dbeafe',
    backgroundImage: `
      radial-gradient(ellipse 60% 55% at -5% -5%, rgba(29, 78, 216, 0.70) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 55% 50% at 105% -5%, rgba(30, 58, 138, 0.65) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 65% 60% at 105% 105%, rgba(30, 58, 138, 0.90) 0%, rgba(29, 78, 216, 0.70) 30%, rgba(59, 130, 246, 0.40) 60%, transparent 85%),
      radial-gradient(ellipse 55% 50% at -5% 105%, rgba(37, 99, 235, 0.60) 0%, rgba(96, 165, 250, 0.40) 40%, transparent 75%),
      radial-gradient(ellipse 90% 80% at 50% 50%, #e2eeff 0%, #cee3fe 45%, #b9d7fd 100%)
    `,
    backgroundAttachment: 'local',
    backgroundSize: '100% 100%'
  };

  const mainContent = (
    <div 
      style={platformGradientStyle}
      className={`flex flex-col text-slate-900 overflow-hidden font-sans select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[999999] h-screen w-screen' 
          : 'w-full h-full rounded-2xl border border-blue-300/80 shadow-lg min-h-[640px] relative'
      }`}
    >

      {/* ── TOP EXECUTIVE APP HEADER BAR (CONFORME A FOTO) ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-200/80 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-amber-300 flex items-center justify-center shadow-xs shrink-0 ring-1 ring-blue-400/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black uppercase text-blue-950 tracking-wider">
                {treeData.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                {treeData.badgeText || '5 NÍVEIS'}
              </span>
              {activeMode === 'manual' && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs">
                  Modo Manual
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-900/70 font-medium">
              {treeData.subtitle}
            </p>
          </div>
        </div>

        {/* CONTROLS: CRITICAL MONTH, METRIC SWITCH, ZOOM, SEARCH, BUILDER BUTTON, FULLSCREEN */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          
          {/* Critical Highlight Badge */}
          {treeData.criticalHighlight && (
            <div className="px-3 py-1 rounded-xl bg-rose-100/95 border border-rose-300 flex items-center gap-1.5 text-rose-950 text-xs font-black shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
              <span className="text-[11px]">
                {treeData.criticalHighlight}
              </span>
            </div>
          )}

          {/* Metric Switcher: R$ PREJUÍZO vs VOLUME (UN) */}
          <div className="flex items-center bg-blue-100/80 p-0.5 rounded-xl border border-blue-300/80 shadow-2xs">
            <button
              onClick={() => setMetricMode('valor')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'valor'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200'
                  : 'text-blue-900/70 hover:text-blue-950'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              {treeData.currencySymbol} {activeMode === 'manual' ? 'Valor' : 'Prejuízo'}
            </button>
            <button
              onClick={() => setMetricMode('quantidade')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'quantidade'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200'
                  : 'text-blue-900/70 hover:text-blue-950'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-blue-600" />
              Volume ({treeData.unitName})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar..."
              className="w-full bg-white text-blue-950 placeholder:text-blue-900/50 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-blue-200 outline-none focus:border-blue-500 transition-all font-medium shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-blue-100/80 p-0.5 rounded-xl border border-blue-300/80 text-xs font-bold shadow-2xs">
            <button
              onClick={() => {
                setZoomLevel(prev => Math.max(75, prev - 5));
                setTimeout(calculateConnectors, 100);
              }}
              title="Reduzir Zoom"
              className="p-1 rounded hover:bg-white text-blue-800 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-blue-950 font-bold text-[10px]">{zoomLevel}%</span>
            <button
              onClick={() => {
                setZoomLevel(prev => Math.min(120, prev + 5));
                setTimeout(calculateConnectors, 100);
              }}
              title="Aumentar Zoom"
              className="p-1 rounded hover:bg-white text-blue-800 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* NOVA PÁGINA / GERENCIAR ÁRVORES */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Criar nova árvore ou página manual"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Nova Página</span>
          </button>

          {/* MODO CONSTRUTOR MANUAL / EDITAR */}
          <button
            onClick={() => {
              if (activeMode === 'automatic') {
                setActiveMode('manual');
              } else {
                setIsSettingsModalOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              activeMode === 'manual'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600'
                : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300'
            }`}
            title="Construir ou editar a árvore manualmente"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{activeMode === 'manual' ? '⚙️ Construtor Ativo' : '🛠️ Modo Manual'}</span>
          </button>

          {/* Toggle Fullscreen / Expandir em Outra Tela */}
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(calculateConnectors, 100);
            }}
            title={isFullscreen ? 'Restaurar ao Painel Normal (Esc)' : 'Expandir Árvore em Tela Cheia'}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isFullscreen
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700'
                : 'bg-white hover:bg-blue-50 text-blue-950 border border-blue-300'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden sm:inline">Expandir Tela</span>
              </>
            )}
          </button>

          {(onClose || isFullscreen) && (
            <button
              onClick={() => {
                if (isFullscreen && !isModal) {
                  setIsFullscreen(false);
                } else if (onClose) {
                  onClose();
                }
              }}
              title="Fechar"
              className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── BREADCRUMB ACTIVE PATH (ALINHADO COM A FOTO) ── */}
      <div className="bg-white/80 backdrop-blur-xs border-b border-blue-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs font-mono overflow-x-auto shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-blue-950/70 flex items-center gap-1 shrink-0 font-sans font-black text-[10px] uppercase tracking-widest">
            <Layers className="w-3 h-3 text-blue-700" />
            Foco Ativo:
          </span>
          <button
            onClick={() => {
              // Reset drilldown
              calculateConnectors();
            }}
            className="font-bold text-blue-950 bg-white px-2.5 py-0.5 rounded-lg border border-blue-300 shadow-2xs shrink-0 text-[11px] hover:bg-blue-50 cursor-pointer"
          >
            {treeData.levels.level1Title && treeData.levels.level1Title !== 'TOTAL CONSOLIDADO' ? treeData.levels.level1Title : 'ÁRVORE DE KPI'}
          </button>
          {activeL2Node && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className={`font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs shrink-0 text-[11px] ${
                activeL2Node.isCritical 
                  ? 'bg-rose-100 text-rose-950 border-rose-300' 
                  : 'bg-blue-100 text-blue-950 border-blue-300'
              }`}>
                {activeL2Node.label}{activeL2Node.sublabel || ''}
              </span>
            </>
          )}
          {activeL3Node && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs shrink-0 text-[11px]">
                {activeL3Node.label}
              </span>
            </>
          )}
          {activeL4Node && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-bold px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs shrink-0 text-[11px]">
                {activeL4Node.label}
              </span>
            </>
          )}
          {activeL5Node && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs shrink-0 text-[11px]">
                {activeL5Node.label}
              </span>
            </>
          )}
          {activeL6Node && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs shrink-0 text-[11px]">
                {activeL6Node.label}
              </span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-bold px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-950 border border-rose-300 shadow-2xs shrink-0 text-[11px]">
            {treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS'}
          </span>
        </div>

        {activeMode === 'manual' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-bold">
              ✏️ Clique no lápis dos cards para editar qualquer valor ou criar novos nós
            </span>
          </div>
        )}
      </div>

      {/* ── MAIN 7-COLUMNS WORKSPACE ── */}
      <div 
        ref={containerRef}
        onScroll={calculateConnectors}
        className={`relative flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-3 select-none ${
          isFullscreen ? 'h-[calc(100vh-120px)]' : 'min-h-[520px] h-[calc(100vh-195px)] max-h-[820px]'
        }`}
      >
        {/* DYNAMIC SVG CANVAS FOR LUMINOUS ARCHITECTURAL BEZIER CURVES */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="grad-root-blue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-root-rose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-month-amber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-motivo-sky" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-pkg-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#047857" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-l6-purple" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-l7-rose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
            </linearGradient>
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.15" />
            </filter>
          </defs>
          {svgPaths.map((path, pIdx) => (
            <g key={`path-${path.id}-${pIdx}`}>
              <path
                d={path.d}
                fill="none"
                stroke={`url(#${path.gradientId})`}
                strokeWidth={path.strokeWidth || 3}
                strokeOpacity={path.opacity || 1}
                strokeLinecap="round"
                filter="url(#soft-glow)"
                className="transition-all duration-300"
              />
              <circle
                cx={path.startPoint.x}
                cy={path.startPoint.y}
                r={path.isCurrentActive ? 4.5 : 3.5}
                fill={path.color}
                stroke="#ffffff"
                strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                className="shadow-sm"
              />
              <circle
                cx={path.endPoint.x}
                cy={path.endPoint.y}
                r={path.isCurrentActive ? 4.5 : 3.5}
                fill={path.color}
                stroke="#ffffff"
                strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                className="shadow-sm"
              />
            </g>
          ))}
        </svg>

        {/* 7 HIERARCHICAL COLUMNS COM CARDS VIDRO TRANSLÚCIDO IMPECÁVEIS */}
        <div 
          style={{ 
            zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
            transformOrigin: 'top left'
          }}
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-2.5 w-full min-w-[1550px] items-stretch min-h-full"
        >

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 1: TOTAL GERAL (CARD RAIZ EXECUTIVO)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1 h-full min-h-[220px]">
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[10px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">01</span>
                {treeData.levels.level1Title && treeData.levels.level1Title !== 'TOTAL CONSOLIDADO' ? treeData.levels.level1Title : 'ÁRVORE DE KPI'}
              </span>
              <span className="text-[8.5px] text-blue-900/70 font-black uppercase tracking-wider">{treeData.levels.level1Badge}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center my-auto">
              <div
                ref={rootCardRef}
                className="bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs border border-blue-200 space-y-1.5 relative overflow-hidden transition-all hover:shadow-md hover:border-blue-400 group"
              >
                <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate max-w-[130px]">
                    {treeData.nodes.level1.label && treeData.nodes.level1.label !== 'TOTAL CONSOLIDADO' 
                      ? treeData.nodes.level1.label 
                      : 'ÁRVORE DE KPI'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1 text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {treeData.nodes.level1.badge || '0 Lançamentos'}
                    </span>
                    {activeMode === 'manual' && (
                      <button
                        onClick={() => setEditNodeModal({
                          isOpen: true,
                          levelNumber: 1,
                          levelTitle: treeData.levels.level1Title || 'Árvore de KPI',
                          node: treeData.nodes.level1
                        })}
                        className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                        title="Editar Card Raiz"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-1 px-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded border border-amber-400/30 text-[8.5px] text-slate-800 flex items-center gap-1 font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                  <span className="truncate">{treeData.summaryTag || 'Estrutura personalizada ativa.'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 2: MESES / PERÍODO
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1 h-full min-h-[220px]">
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[10px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">02</span>
                {treeData.levels.level2Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-blue-900/70 font-black uppercase tracking-wider">{l2Nodes.length} Cards</span>
                {activeMode === 'manual' && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 2,
                      levelTitle: treeData.levels.level2Title,
                      node: null
                    })}
                    className="p-0.5 rounded bg-blue-100 text-blue-900 hover:bg-blue-200"
                    title="Adicionar Novo Card"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${l2Nodes.length <= 3 ? 'justify-between py-1' : 'space-y-1.5 overflow-y-auto'} max-h-[calc(100vh-230px)] min-h-[220px] pr-0.5 scrollbar-thin scrollbar-thumb-blue-300`}>
              {l2Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-blue-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Calendar className="w-4 h-4 text-blue-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum período cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Crie nós manuais ou importe quebras.</p>
                </div>
              ) : (
                l2Nodes.map((m, mIdx) => {
                const isSelected = selectedL2Id === m.id;
                const isCritical = m.isCritical;
                const maxVal = Math.max(...l2Nodes.map(n => n.value), 1);
                const progressPercent = Math.min(100, Math.round((m.value / maxVal) * 100));
                const sharePercent = m.percentage !== undefined ? `${m.percentage}%` : `${((m.value / (treeData.totalValue || 1)) * 100).toFixed(1)}%`;
                const subCount = (treeData.nodes.level3[m.id] || []).length;
                const unitAvg = m.volume && m.volume > 0 ? (m.value / m.volume) : 0;

                const isDragging = draggedNode?.level === 2 && draggedNode?.id === m.id;
                const isDropTarget = dragOverTarget?.level === 2 && dragOverTarget?.index === mIdx && !isDragging;

                return (
                  <div
                    key={`l2-node-${m.id}-${mIdx}`}
                    ref={el => { l2CardRefs.current[m.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', m.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 2, index: mIdx, id: m.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 2 || dragOverTarget?.index !== mIdx) {
                        setDragOverTarget({ level: 2, index: mIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 2 && dragOverTarget?.index === mIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 2) {
                        handleReorderNode(2, undefined, draggedNode.index, mIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      setSelectedL2Id(m.id);
                      setTimeout(calculateConnectors, 50);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1.5 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-blue-500 bg-blue-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-blue-500/80 ring-offset-1 border-2 border-blue-600 scale-[1.01]'
                          : isSelected
                            ? isCritical
                              ? 'border-2 border-rose-500 ring-2 ring-rose-400/50 shadow-md'
                              : 'border-2 border-blue-600 ring-2 ring-blue-500/50 shadow-md'
                            : isCritical
                              ? 'border border-rose-300 hover:border-rose-500 hover:shadow-xs'
                              : 'border border-blue-200 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className={`absolute inset-y-0 left-0 opacity-10 pointer-events-none transition-all ${
                        isCritical ? 'bg-rose-600' : 'bg-blue-600'
                      }`}
                    />

                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between border-b border-blue-100 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate flex items-center gap-1 max-w-[125px]">
                        {renderNodeIcon(m.iconName || 'calendar')}
                        <span className="truncate">{m.label} {m.sublabel ? `(${m.sublabel})` : ''}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCritical && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                            <Flame className="w-2 h-2 text-rose-600" />
                            Crítico
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {sharePercent}
                        </span>

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={mIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(2, undefined, mIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                mIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={mIdx === l2Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(2, undefined, mIdx, l2Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                mIdx === l2Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 2,
                                  levelTitle: treeData.levels.level2Title,
                                  node: m
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Editar Card"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Tag Bar */}
                    <div className="relative z-10 p-1 px-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded border border-amber-400/30 text-[8.5px] text-slate-800 flex items-center gap-1 font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">{m.metaInfo || 'Dados Operacionais'}</span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 3: NÍVEL 3 (SUB-RAMOS / MOTIVOS / CAUSAS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">03</span>
                {treeData.levels.level3Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-amber-900/70 font-black uppercase tracking-wider">{l3Nodes.length} Cards</span>
                {activeMode === 'manual' && activeL2Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 3,
                      levelTitle: treeData.levels.level3Title,
                      node: null,
                      parentId: activeL2Node.id
                    })}
                    className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200"
                    title="Adicionar Sub-ramo"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-amber-300">
              {l3Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-amber-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum sub-ramo cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um card anterior ou adicione um novo.</p>
                </div>
              ) : (
                l3Nodes.map((mot, motIdx) => {
                const isSelected = selectedL3Id === mot.id;
                const parentTotal = activeL2Node ? activeL2Node.value : 1;
                const sharePercent = mot.percentage !== undefined ? `${mot.percentage}%` : `${((mot.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                const progressPercent = Math.min(100, Math.round((mot.value / (parentTotal || 1)) * 100));
                const subCount = (treeData.nodes.level4[mot.id] || []).length;
                const unitAvg = mot.volume && mot.volume > 0 ? (mot.value / mot.volume) : 0;
                const parentId = activeL2Node?.id;

                const isDragging = draggedNode?.level === 3 && draggedNode?.id === mot.id;
                const isDropTarget = dragOverTarget?.level === 3 && dragOverTarget?.index === motIdx && !isDragging;

                return (
                  <div
                    key={`l3-node-${mot.id}-${motIdx}`}
                    ref={el => { l3CardRefs.current[mot.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', mot.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 3, parentId, index: motIdx, id: mot.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 3 || dragOverTarget?.index !== motIdx) {
                        setDragOverTarget({ level: 3, parentId, index: motIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 3 && dragOverTarget?.index === motIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 3 && parentId) {
                        handleReorderNode(3, parentId, draggedNode.index, motIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      setSelectedL3Id(mot.id);
                      setTimeout(calculateConnectors, 50);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-2.5 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1.5 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-amber-500 bg-amber-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-amber-500/80 ring-offset-1 border-2 border-amber-600 scale-[1.01]'
                          : isSelected
                            ? 'border-2 border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                            : 'border border-amber-200 hover:border-amber-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-amber-500 opacity-10 pointer-events-none transition-all"
                    />

                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between border-b border-amber-100 pb-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-950 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate flex items-center gap-1 max-w-[115px]">
                        {renderNodeIcon(mot.iconName || 'layers')}
                        <span className="truncate">{mot.label}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="flex items-center gap-1 text-[7.5px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {sharePercent}
                        </span>

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={motIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(3, parentId, motIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                motIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={motIdx === l3Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(3, parentId, motIdx, l3Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                motIdx === l3Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 3,
                                  levelTitle: treeData.levels.level3Title,
                                  node: mot,
                                  parentId: parentId,
                                  availableParents: l2Nodes.map(n => ({ id: n.id, label: n.label }))
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                              title="Editar Card / Trocar Ramo"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metric Display */}
                    <div className="relative z-10">
                      <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider block">Valor do Sub-ramo</span>
                      <strong className="text-[15px] font-mono font-black text-amber-900 block leading-tight tracking-tight mt-0.5">
                        {metricMode === 'valor'
                          ? `${treeData.currencySymbol} ${mot.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${(mot.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`}
                      </strong>
                      <span className="text-[8.5px] text-slate-500 font-medium block mt-0.5 truncate">
                        {metricMode === 'valor'
                          ? `${(mot.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`
                          : `Impacto: ${treeData.currencySymbol} ${mot.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>

                    {/* 2-Column Grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-amber-100">
                      <div className="bg-amber-50/80 p-1 px-1.5 rounded-md border border-amber-200/80">
                        <span className="text-[7px] text-amber-900/70 uppercase font-bold block">Segmentos</span>
                        <strong className="font-mono text-amber-950 text-[10px] font-bold block">
                          {subCount}
                        </strong>
                      </div>
                      <div className="bg-amber-50/80 p-1 px-1.5 rounded-md border border-amber-200/80">
                        <span className="text-[7px] text-amber-900/70 uppercase font-bold block">Média / Unit.</span>
                        <strong className="font-mono text-emerald-700 text-[10px] font-bold block truncate">
                          {treeData.currencySymbol} {unitAvg.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Bottom Tag Bar */}
                    <div className="relative z-10 p-1 px-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded-md border border-amber-400/30 text-[8.5px] text-slate-800 flex items-center gap-1 font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">{mot.metaInfo || 'Detalhamento do sub-ramo'}</span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 4: NÍVEL 4 (SEGMENTOS / TIPOS / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-sky-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">04</span>
                {treeData.levels.level4Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-sky-900/70 font-black uppercase tracking-wider">{l4Nodes.length} Cards</span>
                {activeMode === 'manual' && activeL3Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 4,
                      levelTitle: treeData.levels.level4Title,
                      node: null,
                      parentId: activeL3Node.id
                    })}
                    className="p-0.5 rounded bg-sky-100 text-sky-900 hover:bg-sky-200"
                    title="Adicionar Segmento"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-sky-300">
              {l4Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-sky-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-sky-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum segmento cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um card anterior ou adicione um novo.</p>
                </div>
              ) : (
                l4Nodes.map((pkg, pkgIdx) => {
                const isSelected = selectedL4Id === pkg.id;
                const parentTotal = activeL3Node ? activeL3Node.value : 1;
                const sharePercent = pkg.percentage !== undefined ? `${pkg.percentage}%` : `${((pkg.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                const progressPercent = Math.min(100, Math.round((pkg.value / (parentTotal || 1)) * 100));
                const subCount = (treeData.nodes.level5[pkg.id] || []).length;
                const unitAvg = pkg.volume && pkg.volume > 0 ? (pkg.value / pkg.volume) : 0;
                const parentId = activeL3Node?.id;

                const isDragging = draggedNode?.level === 4 && draggedNode?.id === pkg.id;
                const isDropTarget = dragOverTarget?.level === 4 && dragOverTarget?.index === pkgIdx && !isDragging;

                return (
                  <div
                    key={`l4-node-${pkg.id}-${pkgIdx}`}
                    ref={el => { l4CardRefs.current[pkg.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', pkg.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 4, parentId, index: pkgIdx, id: pkg.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 4 || dragOverTarget?.index !== pkgIdx) {
                        setDragOverTarget({ level: 4, parentId, index: pkgIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 4 && dragOverTarget?.index === pkgIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 4 && parentId) {
                        handleReorderNode(4, parentId, draggedNode.index, pkgIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      setSelectedL4Id(pkg.id);
                      setTimeout(calculateConnectors, 50);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-2.5 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1.5 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-sky-500 bg-sky-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-sky-500/80 ring-offset-1 border-2 border-sky-600 scale-[1.01]'
                          : isSelected
                            ? 'border-2 border-sky-500 ring-2 ring-sky-400/50 shadow-md'
                            : 'border border-sky-200 hover:border-sky-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-sky-500 opacity-10 pointer-events-none transition-all"
                    />

                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between border-b border-sky-100 pb-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-sky-950 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 truncate flex items-center gap-1 max-w-[115px]">
                        {renderNodeIcon(pkg.iconName || 'box')}
                        <span className="truncate">{pkg.label}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="flex items-center gap-1 text-[7.5px] font-bold text-sky-900 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          {sharePercent}
                        </span>

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={pkgIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(4, parentId, pkgIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                pkgIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pkgIdx === l4Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(4, parentId, pkgIdx, l4Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                pkgIdx === l4Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-sky-700 hover:bg-sky-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 4,
                                  levelTitle: treeData.levels.level4Title,
                                  node: pkg,
                                  parentId: parentId,
                                  availableParents: (l3Nodes.length > 0 ? l3Nodes : Object.values(treeData.nodes.level3).flat()).map(n => ({ id: n.id, label: n.label }))
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                              title="Editar Card / Trocar Ramo"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metric Display */}
                    <div className="relative z-10">
                      <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider block">Valor do Segmento</span>
                      <strong className="text-[15px] font-mono font-black text-sky-900 block leading-tight tracking-tight mt-0.5">
                        {metricMode === 'valor'
                          ? `${treeData.currencySymbol} ${pkg.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${(pkg.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`}
                      </strong>
                      <span className="text-[8.5px] text-slate-500 font-medium block mt-0.5 truncate">
                        {metricMode === 'valor'
                          ? `${(pkg.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`
                          : `Impacto: ${treeData.currencySymbol} ${pkg.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>

                    {/* 2-Column Grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-sky-100">
                      <div className="bg-sky-50/80 p-1 px-1.5 rounded-md border border-sky-200/80">
                        <span className="text-[7px] text-sky-900/70 uppercase font-bold block">Itens / SKUs</span>
                        <strong className="font-mono text-sky-950 text-[10px] font-bold block">
                          {subCount}
                        </strong>
                      </div>
                      <div className="bg-sky-50/80 p-1 px-1.5 rounded-md border border-sky-200/80">
                        <span className="text-[7px] text-sky-900/70 uppercase font-bold block">Média / Unit.</span>
                        <strong className="font-mono text-emerald-700 text-[10px] font-bold block truncate">
                          {treeData.currencySymbol} {unitAvg.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Bottom Tag Bar */}
                    <div className="relative z-10 p-1 px-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded-md border border-amber-400/30 text-[8.5px] text-slate-800 flex items-center gap-1 font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">{pkg.metaInfo || 'Agrupamento operacional'}</span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 5: NÍVEL 5 (DETALHAMENTO / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div ref={top10ContainerRef} className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">05</span>
                {treeData.levels.level5Title || 'NÍVEL 5'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-emerald-900/70 font-black uppercase tracking-wider">{l5Nodes.length} Ramos</span>
                {activeMode === 'manual' && activeL4Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 5,
                      levelTitle: treeData.levels.level5Title || 'NÍVEL 5',
                      node: null,
                      parentId: activeL4Node.id
                    })}
                    className="p-0.5 rounded bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                    title="Adicionar Nó no Nível 5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-emerald-300">
              {l5Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-emerald-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-emerald-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum nó cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um segmento anterior ou adicione um novo nó.</p>
                </div>
              ) : (
                l5Nodes.map((l5Item, l5Idx) => {
                  const isSelected = l5Item.id === selectedL5Id;
                  const parentTotal = activeL4Node ? activeL4Node.value : 1;
                  const sharePercent = l5Item.percentage !== undefined ? `${l5Item.percentage}%` : `${((l5Item.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL4Node?.id;

                  const isDragging = draggedNode?.level === 5 && draggedNode?.id === l5Item.id;
                  const isDropTarget = dragOverTarget?.level === 5 && dragOverTarget?.index === l5Idx && !isDragging;

                  const subNodes = (treeData.nodes.level6 && treeData.nodes.level6[l5Item.id]) || [];
                  const subCount = subNodes.length;

                  return (
                    <div
                      key={`l5-card-${l5Item.id}-${l5Idx}`}
                      ref={el => { l5CardRefs.current[l5Item.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onClick={() => {
                        setSelectedL5Id(l5Item.id);
                        setTimeout(calculateConnectors, 50);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', l5Item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 5, parentId, index: l5Idx, id: l5Item.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 5 || dragOverTarget?.index !== l5Idx) {
                          setDragOverTarget({ level: 5, parentId, index: l5Idx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 5 && dragOverTarget?.index === l5Idx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 5 && parentId) {
                          handleReorderNode(5, parentId, draggedNode.index, l5Idx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-2.5 shadow-xs transition-all space-y-1.5 relative overflow-hidden group cursor-pointer ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-emerald-500 bg-emerald-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-emerald-500/80 ring-offset-1 border-2 border-emerald-600 scale-[1.01]'
                            : isSelected
                              ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/50 scale-[1.01]'
                              : 'border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-emerald-100 pb-1">
                        <div className="flex items-center gap-1 min-w-0 max-w-[125px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <h4 className="text-[10px] font-bold text-slate-900 truncate" title={l5Item.label}>
                            {l5Item.label}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="flex items-center gap-1 text-[7.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-300 shadow-2xs">
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={l5Idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(5, parentId, l5Idx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l5Idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={l5Idx === l5Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(5, parentId, l5Idx, l5Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l5Idx === l5Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar nó"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditNodeModal({
                                    isOpen: true,
                                    levelNumber: 5,
                                    levelTitle: treeData.levels.level5Title || 'NÍVEL 5',
                                    node: l5Item,
                                    parentId: parentId,
                                    availableParents: (l4Nodes.length > 0 ? l4Nodes : Object.values(treeData.nodes.level4).flat()).map(n => ({ id: n.id, label: n.label }))
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                                title="Editar Nó / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metric Display */}
                      <div className="relative z-10">
                        <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider block">Valor</span>
                        <strong className="text-[14px] font-mono font-black text-emerald-900 block leading-tight tracking-tight mt-0.5">
                          {metricMode === 'valor'
                            ? `${treeData.currencySymbol} ${l5Item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${(l5Item.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`}
                        </strong>
                        <span className="text-[8.5px] text-slate-500 font-medium block truncate">
                          {subCount > 0 ? `${subCount} nós no Nível 6` : 'Clique para detalhar'}
                        </span>
                      </div>

                      {/* Bottom Tag Bar */}
                      <div className="relative z-10 p-1 px-1.5 bg-emerald-50 rounded-md border border-emerald-200 text-[8px] text-emerald-950 flex items-center justify-between font-medium">
                        <span className="truncate">{l5Item.metaInfo || 'Detalhamento'}</span>
                        <ChevronRight className={`w-3 h-3 text-emerald-600 transition-transform ${isSelected ? 'translate-x-0.5' : ''}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 6: NÍVEL 6 (OPERAÇÃO / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">06</span>
                {treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-purple-900/70 font-black uppercase tracking-wider">{l6Nodes.length} Sub-itens</span>
                {activeMode === 'manual' && activeL5Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 6,
                      levelTitle: treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO',
                      node: null,
                      parentId: activeL5Node.id
                    })}
                    className="p-0.5 rounded bg-purple-100 text-purple-900 hover:bg-purple-200"
                    title="Adicionar Nó no Nível 6"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-purple-300">
              {l6Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-purple-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-purple-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum nó cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um nó no Nível 5 para visualizar ou adicione um novo.</p>
                </div>
              ) : (
                l6Nodes.map((l6Item, l6Idx) => {
                  const isSelected = l6Item.id === selectedL6Id;
                  const parentTotal = activeL5Node ? activeL5Node.value : 1;
                  const sharePercent = l6Item.percentage !== undefined ? `${l6Item.percentage}%` : `${((l6Item.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL5Node?.id;

                  const isDragging = draggedNode?.level === 6 && draggedNode?.id === l6Item.id;
                  const isDropTarget = dragOverTarget?.level === 6 && dragOverTarget?.index === l6Idx && !isDragging;

                  const subNodes = (treeData.nodes.level7 && treeData.nodes.level7[l6Item.id]) || [];
                  const subCount = subNodes.length;

                  return (
                    <div
                      key={`l6-card-${l6Item.id}-${l6Idx}`}
                      ref={el => { l6CardRefs.current[l6Item.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onClick={() => {
                        setSelectedL6Id(l6Item.id);
                        setTimeout(calculateConnectors, 50);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', l6Item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 6, parentId, index: l6Idx, id: l6Item.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 6 || dragOverTarget?.index !== l6Idx) {
                          setDragOverTarget({ level: 6, parentId, index: l6Idx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 6 && dragOverTarget?.index === l6Idx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 6 && parentId) {
                          handleReorderNode(6, parentId, draggedNode.index, l6Idx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-2.5 shadow-xs transition-all space-y-1.5 relative overflow-hidden group cursor-pointer ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-purple-500 bg-purple-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-purple-500/80 ring-offset-1 border-2 border-purple-600 scale-[1.01]'
                            : isSelected
                              ? 'border-2 border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-400/50 scale-[1.01]'
                              : 'border border-purple-200 hover:border-purple-400 hover:bg-purple-50/30'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-purple-100 pb-1">
                        <div className="flex items-center gap-1 min-w-0 max-w-[125px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                          <h4 className="text-[10px] font-bold text-slate-900 truncate" title={l6Item.label}>
                            {l6Item.label}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="flex items-center gap-1 text-[7.5px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-300 shadow-2xs">
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={l6Idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(6, parentId, l6Idx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l6Idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-purple-700 hover:bg-purple-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={l6Idx === l6Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(6, parentId, l6Idx, l6Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l6Idx === l6Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-purple-700 hover:bg-purple-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar nó"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditNodeModal({
                                    isOpen: true,
                                    levelNumber: 6,
                                    levelTitle: treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO',
                                    node: l6Item,
                                    parentId: parentId,
                                    availableParents: (l5Nodes.length > 0 ? l5Nodes : Object.values(treeData.nodes.level5).flat()).map(n => ({ id: n.id, label: n.label }))
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                                title="Editar Nó / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metric Display */}
                      <div className="relative z-10">
                        <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider block">Valor</span>
                        <strong className="text-[14px] font-mono font-black text-purple-900 block leading-tight tracking-tight mt-0.5">
                          {metricMode === 'valor'
                            ? `${treeData.currencySymbol} ${l6Item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${(l6Item.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`}
                        </strong>
                        <span className="text-[8.5px] text-slate-500 font-medium block truncate">
                          {subCount > 0 ? `${subCount} itens / SKUs no Nível 7` : 'Clique para ver itens'}
                        </span>
                      </div>

                      {/* Bottom Tag Bar */}
                      <div className="relative z-10 p-1 px-1.5 bg-purple-50 rounded-md border border-purple-200 text-[8px] text-purple-950 flex items-center justify-between font-medium">
                        <span className="truncate">{l6Item.metaInfo || 'Operação'}</span>
                        <ChevronRight className={`w-3 h-3 text-purple-600 transition-transform ${isSelected ? 'translate-x-0.5' : ''}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 7: NÍVEL 7 (ITENS / SKUS / APONTAMENTOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-rose-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">07</span>
                {treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-rose-900/70 font-black uppercase tracking-wider">{l7Nodes.length} Itens</span>
                {activeMode === 'manual' && activeL6Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 7,
                      levelTitle: treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS',
                      node: null,
                      parentId: activeL6Node.id
                    })}
                    className="p-0.5 rounded bg-rose-100 text-rose-900 hover:bg-rose-200"
                    title="Adicionar Item no Nível 7"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-rose-300">
              {l7Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-rose-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-rose-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum item cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um nó no Nível 6 ou adicione um novo SKU.</p>
                </div>
              ) : (
                l7Nodes.map((prod, pIdx) => {
                  const isExpanded = !!expandedProducts[prod.id];
                  const parentTotal = activeL6Node ? activeL6Node.value : 1;
                  const sharePercent = prod.percentage !== undefined ? `${prod.percentage}%` : `${((prod.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL6Node?.id;

                  const isDragging = draggedNode?.level === 7 && draggedNode?.id === prod.id;
                  const isDropTarget = dragOverTarget?.level === 7 && dragOverTarget?.index === pIdx && !isDragging;

                  const rankNumber = pIdx + 1;
                  const rankBadgeClass = 
                    rankNumber === 1 ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-xs ring-1 ring-amber-400' :
                    rankNumber === 2 ? 'bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-900 font-black' :
                    rankNumber === 3 ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-black' :
                    'bg-slate-100 text-slate-700 font-bold';

                  const rowsCount = prod.records?.length || 0;
                  const unitAvg = prod.unitPrice !== undefined ? prod.unitPrice : (prod.volume && prod.volume > 0 ? prod.value / prod.volume : 0);

                  return (
                    <div
                      key={`l7-card-${prod.id}-${pIdx}`}
                      ref={el => { l7CardRefs.current[prod.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', prod.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 7, parentId, index: pIdx, id: prod.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 7 || dragOverTarget?.index !== pIdx) {
                          setDragOverTarget({ level: 7, parentId, index: pIdx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 7 && dragOverTarget?.index === pIdx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 7 && parentId) {
                          handleReorderNode(7, parentId, draggedNode.index, pIdx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-2.5 shadow-xs transition-all space-y-1.5 relative overflow-hidden group ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-rose-500 bg-rose-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-rose-500/80 ring-offset-1 border-2 border-rose-600 scale-[1.01]'
                            : 'border border-rose-200 hover:border-rose-400 hover:shadow-xs'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-rose-100 pb-1">
                        <div className="flex items-center gap-1 min-w-0 max-w-[115px]">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7.5px] shrink-0 ${rankBadgeClass}`}>
                            #{rankNumber}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-rose-950 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 truncate">
                            {prod.skuCode ? `SKU #${prod.skuCode}` : prod.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="flex items-center gap-1 text-[7.5px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={pIdx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(7, parentId, pIdx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  pIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={pIdx === l7Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(7, parentId, pIdx, l7Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  pIdx === l7Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar item"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                onClick={() => setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 7,
                                  levelTitle: treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS',
                                  node: prod,
                                  parentId: parentId,
                                  availableParents: (l6Nodes.length > 0 ? l6Nodes : Object.values(treeData.nodes.level6 || {}).flat()).map(n => ({ id: n.id, label: n.label }))
                                })}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                                title="Editar Item / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metric Display */}
                      <div className="relative z-10">
                        <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider block">Valor do Item</span>
                        <strong className="text-[15px] font-mono font-black text-rose-900 block leading-tight tracking-tight mt-0.5">
                          {metricMode === 'valor'
                            ? `${treeData.currencySymbol} ${prod.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${(prod.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`}
                        </strong>
                        <div className="mt-0.5">
                          <h4 className="text-[10px] font-bold text-slate-900 leading-snug line-clamp-1" title={prod.label}>
                            {prod.label}
                          </h4>
                          <span className="text-[8.5px] text-slate-500 font-medium block truncate">
                            {metricMode === 'valor'
                              ? `${(prod.volume || 0).toLocaleString('pt-BR')} ${treeData.unitName}`
                              : `Impacto: ${treeData.currencySymbol} ${prod.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      </div>

                      {/* 2-Column Grid */}
                      <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-rose-100">
                        <div className="bg-rose-50/80 p-1 px-1.5 rounded-md border border-rose-200/80">
                          <span className="text-[7px] text-rose-900/70 uppercase font-bold block">Registros</span>
                          <strong className="font-mono text-rose-950 text-[10px] font-bold block">
                            {rowsCount}
                          </strong>
                        </div>
                        <div className="bg-rose-50/80 p-1 px-1.5 rounded-md border border-rose-200/80">
                          <span className="text-[7px] text-rose-900/70 uppercase font-bold block">Média / Unit.</span>
                          <strong className="font-mono text-emerald-700 text-[10px] font-bold block truncate">
                            {treeData.currencySymbol} {unitAvg.toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Bottom Tag Bar */}
                      <div className="relative z-10 p-1 px-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded-md border border-amber-400/30 text-[8.5px] text-slate-800 flex items-center gap-1 font-medium">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span className="truncate">{prod.metaInfo || 'Detalhamento do SKU'}</span>
                      </div>

                      {/* ACCORDION BUTTON FOR INDIVIDUAL RECORDS */}
                      {rowsCount > 0 && (
                        <>
                          <button
                            onClick={() => toggleProductExpansion(prod.id)}
                            className="w-full py-0.5 px-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-950 text-[8px] font-bold flex items-center justify-between transition-all cursor-pointer border border-blue-200"
                          >
                            <span>{rowsCount} apontamentos</span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform text-blue-600 ${isExpanded ? 'rotate-180 text-rose-600' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="pt-1 border-t border-rose-100 space-y-1 max-h-32 overflow-y-auto pr-0.5 text-[8px] font-mono scrollbar-thin scrollbar-thumb-rose-300">
                              {prod.records && prod.records.map((row, idx) => (
                                <div key={`row-${row.id || idx}-${idx}`} className="p-1 bg-rose-50/70 rounded border border-rose-200 space-y-0.5">
                                  <div className="flex items-center justify-between text-slate-700">
                                    <span>{row.dataISO || 'Data Recente'}</span>
                                    <span className="font-bold text-blue-800">{row.motivo || 'REGISTRO'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-800">
                                    <span>Resp: {row.responsavel || 'Operação'}</span>
                                    <strong className="text-emerald-700 font-bold">{row.quantidade} un • {treeData.currencySymbol} {row.valorTotal.toFixed(2)}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SUMMARY BAR ── */}
      <div className="bg-white/90 backdrop-blur-md border-t border-blue-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-950/80 shrink-0 font-mono z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Total Base: <strong className="text-blue-950 font-bold">{treeData.totalRegistros} registros</strong></span>
          <span>•</span>
          <span>Total Consolidado: <strong className="text-blue-950 font-black">{treeData.currencySymbol} {treeData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
          <span>•</span>
          <span>Volume: <strong className="text-blue-950 font-black">{treeData.totalVolume.toLocaleString('pt-BR')} {treeData.unitName}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs text-blue-900/90 font-sans font-medium">
            {activeMode === 'manual' 
              ? '💡 Modo Construtor: Arraste os cards (⋮⋮) ou use as setas (↑ / ↓) para reordenar, ou altere o ramo no botão de edição.'
              : 'Clique em qualquer card para navegar e ramificar os níveis seguintes instantaneamente.'}
          </span>
        </div>
      </div>

      {/* ── MODALS FOR MANUAL EDITING & TREE MANAGEMENT ── */}
      <ManualNodeEditModal
        isOpen={editNodeModal.isOpen}
        onClose={() => setEditNodeModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        levelNumber={editNodeModal.levelNumber}
        levelTitle={editNodeModal.levelTitle}
        node={editNodeModal.node}
        currencySymbol={treeData.currencySymbol}
        unitName={treeData.unitName}
        availableParents={editNodeModal.availableParents}
        currentParentId={editNodeModal.parentId}
        onMoveParent={handleMoveNodeToParent}
      />

      <ManualTreeSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        trees={customTrees}
        activeTreeId={activeTreeId}
        onSelectTree={(id) => {
          setActiveTreeId(id);
          setActiveMode('manual');
        }}
        onSaveTree={(updatedTree) => {
          setCustomTrees(prev => prev.map(t => t.id === updatedTree.id ? updatedTree : t));
        }}
        onDeleteTree={(id) => {
          setCustomTrees(prev => prev.filter(t => t.id !== id));
          if (activeTreeId === id) {
            setActiveTreeId(customTrees[0]?.id || DEFAULT_OFFICIAL_KPI_TREE.id);
          }
        }}
        onCloneOfficial={handleCloneOfficial}
        onCreateNewBlank={handleCreateNewBlank}
      />

    </div>
  );

  return isFullscreen ? createPortal(mainContent, document.body) : mainContent;
}
