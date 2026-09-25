import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RealtimeSync } from "./realtime-sync";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  createClient: vi.fn(),
}));

// A stable router: a fresh object per render would re-run the subscription
// effect on every render and mask duplicate-channel bugs.
vi.mock("next/navigation", () => {
  const router = { refresh: mocks.refresh };
  return { useRouter: () => router };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mocks.createClient(),
}));

type StatusCallback = (status: string) => void;

type ChannelStub = {
  topic: string;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  emitStatus: (status: string) => void;
};

const removeChannel = vi.fn(() => Promise.resolve("ok"));
let channels: ChannelStub[] = [];

function createChannelStub(topic: string): ChannelStub {
  const statusCallbacks: StatusCallback[] = [];
  const channel: ChannelStub = {
    topic,
    on: vi.fn(),
    subscribe: vi.fn(),
    emitStatus: (status) => {
      for (const callback of statusCallbacks) callback(status);
    },
  };
  channel.on.mockImplementation(() => channel);
  channel.subscribe.mockImplementation((callback: StatusCallback) => {
    statusCallbacks.push(callback);
    return channel;
  });
  return channel;
}

function currentChannel() {
  const channel = channels.at(-1);
  if (!channel) throw new Error("RealtimeSync did not open a channel.");
  return channel;
}

function statusText() {
  return screen.getByRole("status").textContent ?? "";
}

beforeEach(() => {
  channels = [];
  mocks.refresh.mockClear();
  removeChannel.mockClear();
  mocks.createClient.mockReturnValue({
    channel: vi.fn((topic: string) => {
      const channel = createChannelStub(topic);
      channels.push(channel);
      return channel;
    }),
    removeChannel,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RealtimeSync", () => {
  it("says updates are connecting, then reports live once the channel subscribes", () => {
    render(<RealtimeSync userId="applicant-1" isProcessing={false} />);

    expect(statusText()).toContain("Connecting updates");

    act(() => currentChannel().emitStatus("SUBSCRIBED"));

    expect(statusText()).toContain("Updating automatically");
    expect(screen.queryByRole("button", { name: "Retry live updates" })).toBeNull();
  });

  it("keeps the five-second refresh running while processing even after the channel fails", () => {
    vi.useFakeTimers();
    render(<RealtimeSync userId="applicant-1" isProcessing />);

    act(() => currentChannel().emitStatus("CHANNEL_ERROR"));
    expect(statusText()).toContain("Live updates are off — refreshing every 5 seconds");

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it("tells an idle applicant to retry or refresh instead of implying hidden progress", () => {
    render(<RealtimeSync userId="applicant-1" isProcessing={false} />);

    act(() => currentChannel().emitStatus("TIMED_OUT"));

    expect(statusText()).toContain("Live updates are off — retry or refresh the page");
    expect(statusText()).not.toContain("Checking for results manually");
  });

  it("recovers through retry without leaving a duplicate channel or stray timer behind", () => {
    vi.useFakeTimers();
    render(<RealtimeSync userId="applicant-1" isProcessing />);

    act(() => currentChannel().emitStatus("CHANNEL_ERROR"));
    const failedChannel = currentChannel();

    fireEvent.click(screen.getByRole("button", { name: "Retry live updates" }));

    expect(removeChannel).toHaveBeenCalledTimes(1);
    expect(removeChannel).toHaveBeenCalledWith(failedChannel);
    expect(channels).toHaveLength(2);
    expect(statusText()).toContain("Connecting updates");

    // The closed channel must not be able to repaint the pill while the retry
    // is in flight, and only the new channel counts as live.
    act(() => failedChannel.emitStatus("CLOSED"));
    expect(statusText()).toContain("Connecting updates");

    act(() => currentChannel().emitStatus("SUBSCRIBED"));
    expect(statusText()).toContain("Updating automatically");

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("treats a connect attempt that never reports anything as offline so retry is reachable", () => {
    vi.useFakeTimers();
    render(<RealtimeSync userId="applicant-1" isProcessing={false} />);

    expect(screen.queryByRole("button", { name: "Retry live updates" })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(statusText()).toContain("Live updates are off — retry or refresh the page");
    expect(screen.getByRole("button", { name: "Retry live updates" })).not.toBeNull();
  });

  it("stops polling once processing finishes", () => {
    vi.useFakeTimers();
    const { rerender } = render(<RealtimeSync userId="applicant-1" isProcessing />);
    act(() => currentChannel().emitStatus("SUBSCRIBED"));

    rerender(<RealtimeSync userId="applicant-1" isProcessing={false} />);

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
