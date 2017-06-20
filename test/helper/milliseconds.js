const milliseconds = (t = 1000) =>
  new Promise(resolve => setTimeout(resolve, t))

export default milliseconds
