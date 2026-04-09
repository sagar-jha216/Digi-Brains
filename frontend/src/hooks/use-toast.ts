import * as React from "react";

export type ToastVariant = "default" | "destructive";
export interface ToastItem { id: string; title?: string; description?: string; variant?: ToastVariant; }

let _toasts: ToastItem[] = [];
let _counter = 0;
const _listeners: Array<(t: ToastItem[]) => void> = [];

function _notify() { _listeners.forEach((l) => l([..._toasts])); }

export function toast(props: Omit<ToastItem, "id">) {
  const id = String(++_counter);
  _toasts = [{ ...props, id }, ..._toasts].slice(0, 5);
  _notify();
  setTimeout(() => { _toasts = _toasts.filter((t) => t.id !== id); _notify(); }, 4000);
}

export function useToast() {
  const [list, setList] = React.useState<ToastItem[]>(_toasts);
  React.useEffect(() => {
    _listeners.push(setList);
    return () => { const i = _listeners.indexOf(setList); if (i > -1) _listeners.splice(i, 1); };
  }, []);
  return { toasts: list, toast };
}
