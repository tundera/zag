import { proxy } from "valtio/vanilla"
import { proxyWithComputed } from "valtio/utils"
import { cast } from "@zag-js/utils"
import { ActionTypes, Dict, StateMachine as S } from "./types"

export function createProxy<TContext, TState extends S.StateSchema, TEvent extends S.EventObject>(
  config: S.MachineConfig<TContext, TState, TEvent>,
) {
  const computedContext = config.computed ?? cast<S.TComputedContext<TContext>>({})
  const initialContext = config.context ?? cast<TContext>({})

  const state = proxy({
    value: "",
    previousValue: "",
    event: cast<Dict>({}),
    context: proxyWithComputed(initialContext, computedContext),
    done: false,
    tags: [] as Array<TState["tags"]>,
    hasTag(tag: TState["tags"]): boolean {
      return this.tags.includes(tag)
    },
    matches(...value: string[]): boolean {
      return value.includes(this.value)
    },
    can(event: string): boolean {
      return cast<any>(this).nextEvents.includes(event)
    },
    get nextEvents() {
      const stateEvents = (config.states as Dict)?.[this.value]?.["on"] ?? {}
      const globalEvents = config?.on ?? {}
      return Object.keys({ ...stateEvents, ...globalEvents })
    },
    get changed() {
      if (this.event.value === ActionTypes.Init || !this.previousValue) return false
      return this.value !== this.previousValue
    },
  })
  return cast<S.State<TContext, TState, TEvent>>(state)
}
