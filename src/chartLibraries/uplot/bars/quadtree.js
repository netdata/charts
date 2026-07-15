export const pointWithin = (px, py, rlft, rtop, rrgt, rbtm) =>
  px >= rlft && px <= rrgt && py >= rtop && py <= rbtm

const MAX_OBJECTS = 10
const MAX_LEVELS = 4

export function Quadtree(x, y, w, h, l) {
  const t = this

  t.x = x
  t.y = y
  t.w = w
  t.h = h
  t.l = l || 0
  t.o = []
  t.q = null
}

const proto = {
  split() {
    const t = this
    const w = t.w / 2
    const h = t.h / 2
    const l = t.l + 1

    t.q = [
      new Quadtree(t.x + w, t.y, w, h, l),
      new Quadtree(t.x, t.y, w, h, l),
      new Quadtree(t.x, t.y + h, w, h, l),
      new Quadtree(t.x + w, t.y + h, w, h, l),
    ]
  },

  quads(x, y, w, h, cb) {
    const t = this
    const q = t.q
    const hzMid = t.x + t.w / 2
    const vtMid = t.y + t.h / 2
    const startIsNorth = y < vtMid
    const startIsWest = x < hzMid
    const endIsEast = x + w > hzMid
    const endIsSouth = y + h > vtMid

    startIsNorth && endIsEast && cb(q[0])
    startIsWest && startIsNorth && cb(q[1])
    startIsWest && endIsSouth && cb(q[2])
    endIsEast && endIsSouth && cb(q[3])
  },

  add(o) {
    const t = this

    if (t.q != null) {
      t.quads(o.x, o.y, o.w, o.h, q => q.add(o))
      return
    }

    const os = t.o
    os.push(o)

    if (os.length > MAX_OBJECTS && t.l < MAX_LEVELS) {
      t.split()

      for (let i = 0; i < os.length; i++) {
        const oi = os[i]
        t.quads(oi.x, oi.y, oi.w, oi.h, q => q.add(oi))
      }

      t.o.length = 0
    }
  },

  get(x, y, w, h, cb) {
    const t = this
    const os = t.o

    for (let i = 0; i < os.length; i++) cb(os[i])

    if (t.q != null) t.quads(x, y, w, h, q => q.get(x, y, w, h, cb))
  },

  clear() {
    this.o.length = 0
    this.q = null
  },
}

Object.assign(Quadtree.prototype, proto)
