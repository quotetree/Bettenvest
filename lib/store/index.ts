import "server-only";

import type { Store } from "@/lib/store/api";
import { localStore } from "@/lib/store/local";
import { supabaseStore } from "@/lib/store/supabase";
import { usingLocalStore } from "@/lib/supabase/client";

export const isLocalStore = usingLocalStore();
export const store: Store = isLocalStore ? localStore : supabaseStore;
