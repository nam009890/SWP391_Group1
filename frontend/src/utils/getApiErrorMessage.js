export function getApiErrorMessage(error, fallbackMessage) {
  const serverMessage = error?.response?.data?.message

  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return fallbackMessage
}
