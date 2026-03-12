"use client";

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { FileIcon, FolderIcon, FolderOpenIcon, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type ItemInfo = { label: string; path: string[]; isFolder: boolean };

function computeVisibleIds(items: Map<string, ItemInfo>, query: string): Set<string> | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const visible = new Set<string>();
  const matchedFolders = new Set<string>();

  for (const [id, info] of items) {
    if (!info.label.toLowerCase().includes(q)) continue;
    visible.add(id);
    info.path.forEach((ancestor) => visible.add(ancestor));
    if (info.isFolder) matchedFolders.add(id);
  }

  for (const [id, info] of items) {
    if (info.path.some((ancestor) => matchedFolders.has(ancestor))) {
      visible.add(id);
      info.path.forEach((ancestor) => visible.add(ancestor));
    }
  }

  return visible;
}

type FileTreeContextValue = {
  selectedId: string | null;
  select: (id: string) => void;
  expandedIds: string[];
  setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  register: (id: string, info: ItemInfo) => void;
  visibleIds: Set<string> | null;
};

const FileTreeContext = React.createContext<FileTreeContextValue | null>(null);
const PathContext = React.createContext<string[]>([]);

function useFileTree() {
  const ctx = React.useContext(FileTreeContext);
  if (!ctx) throw new Error("useFileTree must be used within FileTree");
  return ctx;
}

interface FileTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultExpanded?: string[];
  defaultSelected?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function FileTree({
  className,
  children,
  defaultExpanded = [],
  defaultSelected,
  ref,
  ...props
}: FileTreeProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(defaultSelected ?? null);
  const [expandedIds, setExpandedIds] = React.useState<string[]>(defaultExpanded);
  const [searchQuery, setSearchQuery] = React.useState("");
  const itemsRef = React.useRef<Map<string, ItemInfo>>(new Map());
  const [itemsVersion, forceUpdate] = React.useReducer((value) => value + 1, 0);

  const register = React.useCallback((id: string, info: ItemInfo) => {
    const existing = itemsRef.current.get(id);
    if (existing?.label === info.label && existing?.isFolder === info.isFolder) {
      return;
    }

    itemsRef.current.set(id, info);
    forceUpdate();
  }, []);

  const visibleIds = React.useMemo(
    () => computeVisibleIds(itemsRef.current, searchQuery),
    [itemsVersion, searchQuery],
  );

  React.useEffect(() => {
    if (!visibleIds || visibleIds.size === 0) return;

    setExpandedIds((previous) => {
      const next = new Set([...previous, ...visibleIds]);
      return next.size === previous.length ? previous : [...next];
    });
  }, [visibleIds]);

  return (
    <FileTreeContext.Provider
      value={{
        selectedId,
        select: setSelectedId,
        expandedIds,
        setExpandedIds,
        searchQuery,
        setSearchQuery,
        register,
        visibleIds,
      }}
    >
      <div ref={ref} className={cn("select-none text-sm", className)} {...props}>
        <Accordion.Root
          type="multiple"
          value={expandedIds}
          onValueChange={setExpandedIds}
          className="flex flex-col"
        >
          {children}
        </Accordion.Root>
      </div>
    </FileTreeContext.Provider>
  );
}

interface FileTreeSearchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  onValueChange?: (value: string) => void;
  ref?: React.Ref<HTMLInputElement>;
}

export function FileTreeSearch({ className, onValueChange, ref, ...props }: FileTreeSearchProps) {
  const { searchQuery, setSearchQuery } = useFileTree();

  return (
    <div className="relative mb-3">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        type="text"
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          onValueChange?.(event.target.value);
        }}
        className={cn(
          "h-9 w-full rounded-none border border-input bg-background px-3 pl-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className,
        )}
        {...props}
      />
    </div>
  );
}

interface FolderProps {
  label: string;
  id: string;
  children?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  childrenClassName?: string;
  onOpenChange?: (open: boolean) => void;
  ref?: React.Ref<HTMLDivElement>;
}

export function Folder({
  className,
  triggerClassName,
  contentClassName,
  childrenClassName,
  label,
  id,
  children,
  onOpenChange,
  ref,
}: FolderProps) {
  const { expandedIds, setExpandedIds, register, visibleIds } = useFileTree();
  const parentPath = React.useContext(PathContext);
  const path = React.useMemo(() => [...parentPath, id], [parentPath, id]);
  const isOpen = expandedIds.includes(id);

  React.useEffect(() => {
    register(id, { label, path: parentPath, isFolder: true });
  }, [id, label, parentPath, register]);

  React.useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  if (visibleIds && !visibleIds.has(id)) return null;

  return (
    <PathContext.Provider value={path}>
      <Accordion.Item ref={ref} value={id} className={className}>
        <Accordion.Trigger
          className={cn(
            "group flex w-full items-center gap-2 rounded-none border border-transparent px-2 py-1.5 text-left transition-colors hover:bg-muted/70",
            triggerClassName,
          )}
        >
          {isOpen ? (
            <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          ) : (
            <FolderIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
          <span className="truncate">{label}</span>
        </Accordion.Trigger>

        <Accordion.Content
          forceMount
          className={cn("overflow-hidden", contentClassName)}
          style={{ height: isOpen ? "auto" : 0 }}
        >
          <div className={cn("ml-2 border-l border-border/80 pl-4", childrenClassName)}>
            <Accordion.Root
              type="multiple"
              value={expandedIds}
              onValueChange={setExpandedIds}
              className="flex flex-col"
            >
              {children}
            </Accordion.Root>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </PathContext.Provider>
  );
}

interface FileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  id?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function File({
  className,
  label,
  id,
  icon,
  labelClassName,
  onClick,
  disabled,
  ref,
  ...props
}: FileProps) {
  const { selectedId, select, register, visibleIds } = useFileTree();
  const parentPath = React.useContext(PathContext);
  const fileId = id ?? label;

  React.useEffect(() => {
    register(fileId, { label, path: parentPath, isFolder: false });
  }, [fileId, label, parentPath, register]);

  if (visibleIds && !visibleIds.has(fileId)) return null;

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-none border border-transparent px-2 py-1.5 text-left transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent",
        selectedId === fileId && !disabled && "bg-muted",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          select(fileId);
        }
      }}
      {...props}
    >
      {icon ?? <FileIcon className="size-4 shrink-0 text-muted-foreground" />}
      <span className={cn("truncate", labelClassName)}>{label}</span>
    </button>
  );
}
