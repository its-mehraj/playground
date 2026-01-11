self.onmessage = (e: MessageEvent<{ data: string }>) => {
  // IMPORTANT: use e.data, not e
  const msg = e.data.data;

  self.postMessage(msg);
};
