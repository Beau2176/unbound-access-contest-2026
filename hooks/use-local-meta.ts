"use client";
import { useSyncExternalStore } from "react";
import { getLocalMetaState, getLocalMetaServerState, subscribeLocalMeta } from "../lib/local-meta-client";
export function useLocalMeta() { return useSyncExternalStore(subscribeLocalMeta, getLocalMetaState, getLocalMetaServerState); }
