import { useMemo, useRef, useState, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface TechColumn {
  name: string;
  colLetter: string;
  type: string;
}

interface RequirementsDataTableProps {
  data: any[];
  techColumns: TechColumn[];
  canWrite?: boolean;
}

const buildPointsMap = { 'MS': 4, 'S': 7, 'M': 14, 'C': 24 };
const arqPointsMap = { 'MS': 3, 'S': 6, 'M': 12, 'C': 20 };

export function RequirementsDataTable({
  data: initialData,
  techColumns,
  canWrite = true,
}: RequirementsDataTableProps) {
  const [data, setData] = useState(initialData)

  // Update local data when props change
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const renderBadge = (val: string, type: string = 'Build') => {
    if (!val) return <span className="text-slate-350 font-normal">-</span>;
    
    const isArq = type.toLowerCase().includes('arq') || type.toLowerCase().includes('design');
    const pointsMap = isArq ? arqPointsMap : buildPointsMap;

    const pts = pointsMap[val.toUpperCase() as keyof typeof pointsMap];
    const badgeText = pts !== undefined ? `${val} ${pts} pts` : val;

    switch (val.toUpperCase()) {
      case 'MS':
        return (
          <div className="inline-flex items-center space-x-1 bg-purple-50 text-purple-700 border border-purple-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            <span>{badgeText}</span>
          </div>
        );
      case 'S':
        return (
          <div className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>{badgeText}</span>
          </div>
        );
      case 'M':
        return (
          <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            <span>{badgeText}</span>
          </div>
        );
      case 'C':
        return (
          <div className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            <span>{badgeText}</span>
          </div>
        );
      default:
        return <span className="text-slate-500 font-semibold">{badgeText}</span>;
    }
  };

  const updateData = (rowIndex: number, columnId: string, value: string) => {
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex]!,
            [columnId]: value,
          }
        }
        return row
      })
    )
  }
  
  const columns = useMemo<ColumnDef<any>[]>(() => {
    const baseCols: ColumnDef<any>[] = [
      {
        accessorKey: "macroRequisito",
        header: "Macro Requisito",
        size: 220,
        cell: info => <span className="font-bold text-slate-800">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "tarefa",
        header: "Tarefa",
        size: 260,
        cell: info => {
          const val = info.getValue() as string;
          return val ? (
            <span className="inline-block text-[10px] px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60">
              {val}
            </span>
          ) : <span className="text-slate-400 italic">-</span>;
        }
      },
    ]

    const techCols: ColumnDef<any>[] = techColumns.map(tech => ({
      accessorKey: tech.colLetter,
      header: tech.name,
      size: 140,
      cell: ({ row, column, getValue }) => {
        const val = getValue() as string;
        if (!val && val !== '') return <span className="text-slate-350 font-normal">-</span>;

        return (
          <Select 
            disabled={!canWrite}
            value={val || "NONE"} 
            onValueChange={(newVal: string | null) => updateData(row.index, column.id, (!newVal || newVal === "NONE") ? "" : newVal)}
          >
            <SelectTrigger className="w-full h-8 border-transparent hover:border-slate-200 hover:bg-slate-50 focus:ring-1 focus:ring-primary/20 transition-all bg-transparent shadow-none px-1">
              {renderBadge(val, tech.type)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Remover</SelectItem>
              <SelectItem value="MS">MS (Muito Simples)</SelectItem>
              <SelectItem value="S">S (Simples)</SelectItem>
              <SelectItem value="M">M (Média)</SelectItem>
              <SelectItem value="C">C (Complexa)</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    }))

    return [
      ...baseCols,
      ...techCols,
      {
        accessorKey: "documentacao",
        header: "Documentação",
        size: 150,
        cell: info => (
          <span className="inline-block px-2.5 py-1 rounded bg-[#6358dc]/5 text-primary border border-primary/10 text-xs font-medium">
            {info.getValue() as string}
          </span>
        )
      },
      {
        id: "total",
        header: "Total",
        size: 100,
        cell: ({ row }) => {
          const r = row.original;
          let sum = 0;
          if (r.macroRequisito === 'EF - Escrita Funcional') {
             const numMatch = String(r.documentacao || '').match(/\d+/);
             sum = numMatch ? parseInt(numMatch[0], 10) : 0;
          } else {
             techColumns.forEach(tech => {
               const v = r[tech.colLetter];
               if (v) {
                 const isArq = tech.type.toLowerCase().includes('arq') || tech.type.toLowerCase().includes('design');
                 const ptsMap = isArq ? arqPointsMap : buildPointsMap;
                 sum += ptsMap[v.toUpperCase() as keyof typeof ptsMap] || 0;
               }
             });
          }
          return (
            <span className="text-[10px] font-extrabold text-black shrink-0">
              ({sum} pts)
            </span>
          )
        },
      }
    ]
  }, [techColumns])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Height of rows
    overscan: 10,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto border border-slate-200/60 rounded-2xl relative bg-white shadow-sm overflow-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50">
      <Table className="relative w-full text-xs table-fixed">
        <TableHeader className="sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-gradient-to-r from-[#64183f] to-[#1a1f44]">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-white/10">
              {headerGroup.headers.map(header => {
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="font-black text-white uppercase tracking-widest h-12 align-middle border-r border-white/10 last:border-r-0 bg-transparent text-[10px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          style={{
            height: `${virtualizer.getTotalSize()}px`, 
            position: 'relative',
          }}
          className="divide-y divide-slate-100"
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index]
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="hover:bg-slate-50/60 even:bg-slate-50/20 group/row transition-colors duration-150 h-[56px]"
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="align-middle border-r border-slate-100 last:border-r-0 p-2 truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
