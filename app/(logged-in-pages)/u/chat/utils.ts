export const createMessageId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
