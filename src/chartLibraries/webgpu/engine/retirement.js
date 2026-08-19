export default (submission, resource) =>
  submission.then(
    () => resource.destroy(),
    () => resource.destroy()
  )
