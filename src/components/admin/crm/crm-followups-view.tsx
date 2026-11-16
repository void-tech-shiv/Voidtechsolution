"use client";

import * as React from "react";
import {
  Clock,
  Filter,
  CheckSquare,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFollowUpsViewAction,
  toggleLeadFollowUpAction,
  deleteLeadFollowUpAction,
} from "@/server/actions/crm.actions";

interface FollowUpViewItem {
  id: string;
  enquiryId: string;
  title: string;
  description?: string | null;
  dueAt: Date | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isCompleted: boolean;
  enquiry?: {
    id: string;
    name: string;
    companyName?: string | null;
    status: string;
    serviceCategory: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface CrmFollowupsViewProps {
  canUpdateStatus: boolean;
  onOpenLead: (leadId: string) => void;
}

export function CrmFollowupsView({
  canUpdateStatus,
  onOpenLead,
}: CrmFollowupsViewProps) {
  const [activeFilter, setActiveFilter] = React.useState<"all" | "upcoming" | "overdue" | "completed">("upcoming");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");
  const [tasks, setTasks] = React.useState<FollowUpViewItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const priorityVal =
        selectedPriority === "ALL"
          ? undefined
          : (selectedPriority as "LOW" | "MEDIUM" | "HIGH" | "URGENT");
      const res = await getFollowUpsViewAction({
        status: activeFilter,
        priority: priorityVal,
      });
      if (res.success && res.data) {
        setTasks(res.data as unknown as FollowUpViewItem[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, selectedPriority]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    if (!canUpdateStatus) return;
    const res = await toggleLeadFollowUpAction(taskId, !currentCompleted);
    if (res.success) {
      fetchTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!canUpdateStatus) return;
    if (!confirm("Are you sure you want to remove this follow-up task?")) return;
    const res = await deleteLeadFollowUpAction(taskId);
    if (res.success) {
      fetchTasks();
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-void-dark/80 border border-void-border rounded-xl">
        {/* Status Tab buttons */}
        <div className="flex items-center gap-1 bg-void-surface/50 p-1 rounded-lg border border-void-subtle/60 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: "upcoming", label: "Upcoming" },
              { id: "overdue", label: "Overdue" },
              { id: "completed", label: "Completed" },
              { id: "all", label: "All Tasks" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap",
                activeFilter === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-void-muted hover:text-void-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-void-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs p-1.5 rounded-lg bg-void-surface border border-void-subtle text-void-white focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-16 text-center text-void-muted text-xs">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading follow-up tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 rounded-xl border border-dashed border-void-subtle text-center space-y-1">
            <CheckSquare className="w-8 h-8 text-void-muted mx-auto mb-2 opacity-50" />
            <div className="text-sm font-semibold text-void-white">No follow-up tasks found</div>
            <div className="text-xs text-void-muted">
              {activeFilter === "overdue"
                ? "Excellent! There are no overdue client follow-ups."
                : "No follow-up tasks currently match the selected criteria."}
            </div>
          </div>
        ) : (
          tasks.map((task) => {
            const due = new Date(task.dueAt);
            const isOverdue = !task.isCompleted && due < new Date();

            return (
              <div
                key={task.id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                  task.isCompleted
                    ? "bg-void-surface/20 border-void-subtle/50 opacity-70"
                    : isOverdue
                    ? "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50"
                    : "bg-void-dark/80 border-void-border hover:border-violet-500/30"
                )}
              >
                {/* Left check & info */}
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    disabled={!canUpdateStatus}
                    onChange={() => handleToggle(task.id, task.isCompleted)}
                    className="mt-1 rounded bg-void-dark border-void-border text-violet-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm font-semibold text-void-white",
                          task.isCompleted ? "line-through text-void-muted" : ""
                        )}
                      >
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                          task.priority === "URGENT"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : task.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-void-surface text-void-muted border border-void-subtle"
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-void-light">{task.description}</p>
                    )}

                    {/* Linked Lead Info */}
                    {task.enquiry && (
                      <button
                        type="button"
                        onClick={() => {
                          if (task.enquiry) onOpenLead(task.enquiry.id);
                        }}
                        className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 hover:underline text-left mt-0.5"
                      >
                        <span>Lead: {task.enquiry.name}</span>
                        {task.enquiry.companyName && (
                          <span className="text-void-muted">({task.enquiry.companyName})</span>
                        )}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right metadata & action */}
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-xs">
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-xs font-semibold flex items-center gap-1",
                        isOverdue ? "text-rose-400" : "text-void-light"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{due.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {task.assignedTo && (
                      <div className="text-[11px] text-void-muted">
                        Assigned: {task.assignedTo.name}
                      </div>
                    )}
                  </div>

                  {canUpdateStatus && (
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-void-muted hover:text-rose-400 hover:bg-void-surface transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
