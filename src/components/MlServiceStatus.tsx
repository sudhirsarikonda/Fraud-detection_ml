import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cpu, AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { getMlStatus } from "@/lib/scoring.functions";
import { Button } from "@/components/ui/button";

export function MlServiceStatus() {
  const statusFn = useServerFn(getMlStatus);
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ["ml_status"], queryFn: () => statusFn(), refetchInterval: 30000, retry: false,
  });
  const connected = data?.online && !isError;
  return (
    <div className={`glass flex items-start gap-3 p-4 ${connected ? "border-primary/40" : "border-warning/40"}`} role="status">
      {isPending ? <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground" /> : connected ? <Cpu className="mt-0.5 size-5 shrink-0 text-primary" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />}
      <div className="min-w-0 flex-1 text-sm">
        <b>{isPending ? "Checking sample model…" : connected ? "Sample model ready · demo results" : "Sample model check failed."}</b>
        {data?.checked_at && <div className="text-xs text-muted-foreground">Last checked: {new Date(data.checked_at).toLocaleTimeString()}</div>}
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={() => void refetch()} disabled={isFetching} aria-label="Check sample model" title="Check sample model"><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
    </div>
  );
}