import { createSignal, onCleanup } from "solid-js";

export function Clock() {
  const [now, setNow] = createSignal(new Date());

  const interval = setInterval(() => {
    setNow(new Date());
  }, 1000);

  onCleanup(() => clearInterval(interval));

  return <div>{now().toLocaleTimeString()}</div>;
}
