export default el => (el.getBoundingClientRect().top / window.innerHeight > 0.5 ? "top" : "bottom")
