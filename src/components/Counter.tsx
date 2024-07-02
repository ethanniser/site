import { signal } from "@preact/signals";

export default function Counter() {
  const count = signal(0);
  const add = () => count.value++;
  const subtract = () => count.value--;

  return (
    <div
      class="not-prose flex w-32 flex-row items-center justify-evenly rounded-lg border
        bg-gray-200 py-2"
    >
      <button onClick={subtract}>-</button>
      <p class="w-10 text-center">{count}</p>
      <button onClick={add}>+</button>
    </div>
  );
}
