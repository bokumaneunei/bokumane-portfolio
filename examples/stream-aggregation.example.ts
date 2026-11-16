export type Snapshot = {
  observedAt: string;
  viewerCount: number;
};

export type StreamSummary = {
  startedAt: string;
  endedAt: string;
  observationCount: number;
  averageViewers: number;
  maximumViewers: number;
};

const MAX_GAP_MS = 15 * 60 * 1000;

function summarize(group: Snapshot[]): StreamSummary {
  const counts = group.map((row) => row.viewerCount);
  const average =
    counts.reduce((total, value) => total + value, 0) /
    counts.length;

  return {
    startedAt: group[0].observedAt,
    endedAt: group[group.length - 1].observedAt,
    observationCount: group.length,
    averageViewers: Math.round(average * 100) / 100,
    maximumViewers: Math.max(...counts),
  };
}

/**
 * 15分を超える観測の空白を別配信として扱う簡略例です。
 * 記録がない時間を「視聴者0人」として補完しません。
 */
export function aggregateStreams(
  snapshots: Snapshot[],
): StreamSummary[] {
  const sorted = [...snapshots].sort(
    (a, b) =>
      Date.parse(a.observedAt) - Date.parse(b.observedAt),
  );

  const groups: Snapshot[][] = [];

  for (const snapshot of sorted) {
    const current = groups.at(-1);
    const previous = current?.at(-1);

    if (
      !current ||
      !previous ||
      Date.parse(snapshot.observedAt) -
        Date.parse(previous.observedAt) >
        MAX_GAP_MS
    ) {
      groups.push([snapshot]);
    } else {
      current.push(snapshot);
    }
  }

  return groups.map(summarize);
}
