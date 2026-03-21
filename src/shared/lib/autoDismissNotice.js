export const createAutoDismissNotice = (timeoutMs = 5500) => {
  let timerId = null;

  const clear = () => {
    if (!timerId) {
      return;
    }

    window.clearTimeout(timerId);
    timerId = null;
  };

  const schedule = (callback, customTimeoutMs = timeoutMs) => {
    clear();

    if (typeof window === "undefined") {
      return;
    }

    timerId = window.setTimeout(() => {
      timerId = null;
      callback();
    }, customTimeoutMs);
  };

  return {
    clear,
    schedule,
  };
};

export default createAutoDismissNotice;
