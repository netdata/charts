// ;(function () {
//   var browserRequestAnimationFrame, isCancelled, j, lastId, len, vendor, vendors
//   vendors = ["ms", "moz", "webkit", "o"]
//   for (j = 0, len = vendors.length; j < len; j++) {
//     vendor = vendors[j]
//     if (window.requestAnimationFrame) {
//       break
//     }
//     window.requestAnimationFrame = window[vendor + "RequestAnimationFrame"]
//     window.cancelAnimationFrame =
//       window[vendor + "CancelAnimationFrame"] || window[vendor + "CancelRequestAnimationFrame"]
//   }
//   browserRequestAnimationFrame = null
//   lastId = 0
//   isCancelled = {}
//   if (!requestAnimationFrame) {
//     window.requestAnimationFrame = function (callback, element) {
//       var currTime, id, lastTime, timeToCall
//       currTime = new Date().getTime()
//       timeToCall = Math.max(0, 16 - (currTime - lastTime))
//       id = window.setTimeout(function () {
//         return callback(currTime + timeToCall)
//       }, timeToCall)
//       lastTime = currTime + timeToCall
//       return id
//     }
//     return (window.cancelAnimationFrame = function (id) {
//       return clearTimeout(id)
//     })
//   } else if (!window.cancelAnimationFrame) {
//     browserRequestAnimationFrame = window.requestAnimationFrame
//     window.requestAnimationFrame = function (callback, element) {
//       var myId
//       myId = ++lastId
//       browserRequestAnimationFrame(function () {
//         if (!isCancelled[myId]) {
//           return callback()
//         }
//       }, element)
//       return myId
//     }
//     return (window.cancelAnimationFrame = function (id) {
//       return (isCancelled[id] = true)
//     })
//   }
// })()

const extend = (child, parent) => {
  for (var key in parent.prototype) {
    if (parent.hasOwnProperty(key)) child[key] = parent[key]
  }
  function ctor() {
    this.constructor = child
  }
  ctor.prototype = parent.prototype
  child.prototype = new ctor()
  child.__super__ = parent.prototype
  return child
}

const mergeObjects = (obj1, obj2) => {
  const out = {}

  for (let key in obj1) {
    if (!obj1.hasOwnProperty(key)) continue
    out[key] = obj1[key]
  }

  for (let key in obj2) {
    if (!obj2.hasOwnProperty(key)) continue
    out[key] = obj2[key]
  }

  return out
}

const cutHex = nStr => (nStr.charAt(0) === "#" ? nStr.substring(1, 7) : nStr)

function ValueUpdater(addToAnimationQueue, clear) {
  if (addToAnimationQueue == null) {
    addToAnimationQueue = true
  }
  this.clear = clear != null ? clear : true
  if (addToAnimationQueue) {
    AnimationUpdater.add(this)
  }
}

ValueUpdater.prototype.animationSpeed = 32

ValueUpdater.prototype.update = function (force) {
  var diff
  if (force == null) {
    force = false
  }
  if (force || this.displayedValue !== this.value) {
    if (this.ctx && this.clear) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    diff = this.value - this.displayedValue
    if (Math.abs(diff / this.animationSpeed) <= 0.001) {
      this.displayedValue = this.value
    } else {
      this.displayedValue = this.displayedValue + diff / this.animationSpeed
    }
    this.render()
    return true
  }
  return false
}

function BaseGauge() {
  return BaseGauge.__super__.constructor.apply(this, arguments)
}

extend(BaseGauge, ValueUpdater)

BaseGauge.prototype.displayScale = 1

BaseGauge.prototype.forceUpdate = true

BaseGauge.prototype.setMinValue = function (minValue, updateStartValue) {
  var gauge, j, len, ref, results
  this.minValue = minValue
  if (updateStartValue == null) {
    updateStartValue = true
  }
  if (updateStartValue) {
    this.displayedValue = this.minValue
    ref = this.gp || []
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      gauge = ref[j]
      results.push((gauge.displayedValue = this.minValue))
    }
    return results
  }
}

BaseGauge.prototype.setOptions = function (options) {
  if (options == null) {
    options = null
  }
  this.options = mergeObjects(this.options, options)

  if (this.options.angle > 0.5) {
    this.options.angle = 0.5
  }
  this.configDisplayScale()
  return this
}

BaseGauge.prototype.configDisplayScale = function () {
  var backingStorePixelRatio, devicePixelRatio, height, width

  if (this.options.highDpiSupport === false) {
    delete this.displayScale
  } else {
    devicePixelRatio = window.devicePixelRatio || 1
    backingStorePixelRatio =
      this.ctx.webkitBackingStorePixelRatio ||
      this.ctx.mozBackingStorePixelRatio ||
      this.ctx.msBackingStorePixelRatio ||
      this.ctx.oBackingStorePixelRatio ||
      this.ctx.backingStorePixelRatio ||
      1
    this.displayScale = devicePixelRatio / backingStorePixelRatio
  }

  width = this.canvas.G__width || this.canvas.width
  height = this.canvas.G__height || this.canvas.height
  this.canvas.width = width * this.displayScale
  this.canvas.height = height * this.displayScale
  this.canvas.style.width = width + "px"
  this.canvas.style.height = height + "px"
  this.canvas.G__width = width
  this.canvas.G__height = height

  return this
}

BaseGauge.prototype.parseValue = function (value) {
  value = parseFloat(value) || Number(value)
  if (isFinite(value)) {
    return value
  } else {
    return 0
  }
}

function GaugePointer(gauge1) {
  this.gauge = gauge1
  if (this.gauge === void 0) {
    throw new Error("The element isn't defined.")
  }
  this.ctx = this.gauge.ctx
  this.canvas = this.gauge.canvas
  GaugePointer.__super__.constructor.call(this, false, false)
  this.setOptions()
}

extend(GaugePointer, ValueUpdater)

GaugePointer.prototype.displayedValue = 0

GaugePointer.prototype.value = 0

GaugePointer.prototype.options = {
  strokeWidth: 0.035,
  length: 0.1,
  color: "#000000",
  iconPath: null,
  iconScale: 1.0,
  iconAngle: 0,
}

GaugePointer.prototype.img = null

GaugePointer.prototype.setOptions = function (options) {
  if (options == null) {
    options = null
  }
  this.options = mergeObjects(this.options, options)
  this.length = 2 * this.gauge.radius * this.gauge.options.radiusScale * this.options.length
  this.strokeWidth = this.canvas.height * this.options.strokeWidth
  this.maxValue = this.gauge.maxValue
  this.minValue = this.gauge.minValue
  this.animationSpeed = this.gauge.animationSpeed
  this.options.angle = this.gauge.options.angle
  if (this.options.iconPath) {
    this.img = new Image()
    return (this.img.src = this.options.iconPath)
  }
}

GaugePointer.prototype.render = function () {
  var angle, endX, endY, imgX, imgY, startX, startY, x, y
  angle = this.gauge.getAngle.call(this, this.displayedValue)
  x = Math.round(this.length * Math.cos(angle))
  y = Math.round(this.length * Math.sin(angle))
  startX = Math.round(this.strokeWidth * Math.cos(angle - Math.PI / 2))
  startY = Math.round(this.strokeWidth * Math.sin(angle - Math.PI / 2))
  endX = Math.round(this.strokeWidth * Math.cos(angle + Math.PI / 2))
  endY = Math.round(this.strokeWidth * Math.sin(angle + Math.PI / 2))
  this.ctx.beginPath()
  this.ctx.fillStyle = this.options.color
  this.ctx.arc(0, 0, this.strokeWidth, 0, Math.PI * 2, false)
  this.ctx.fill()
  this.ctx.beginPath()
  this.ctx.moveTo(startX, startY)
  this.ctx.lineTo(x, y)
  this.ctx.lineTo(endX, endY)
  this.ctx.fill()
  if (this.img) {
    imgX = Math.round(this.img.width * this.options.iconScale)
    imgY = Math.round(this.img.height * this.options.iconScale)
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(angle + (Math.PI / 180.0) * (90 + this.options.iconAngle))
    this.ctx.drawImage(this.img, -imgX / 2, -imgY / 2, imgX, imgY)
    return this.ctx.restore()
  }
}

function Gauge(canvas) {
  var h, w
  this.canvas = canvas
  Gauge.__super__.constructor.call(this)
  this.percentColors = null
  if (typeof G_vmlCanvasManager !== "undefined") {
    this.canvas = window.G_vmlCanvasManager.initElement(this.canvas)
  }
  this.ctx = this.canvas.getContext("2d")
  h = this.canvas.clientHeight
  w = this.canvas.clientWidth
  this.canvas.height = h
  this.canvas.width = w
  this.gp = [new GaugePointer(this)]
  this.setOptions()
}

extend(Gauge, BaseGauge)

Gauge.prototype.elem = null

Gauge.prototype.value = [20]

Gauge.prototype.maxValue = 80

Gauge.prototype.minValue = 0

Gauge.prototype.displayedAngle = 0

Gauge.prototype.displayedValue = 0

Gauge.prototype.lineWidth = 40

Gauge.prototype.paddingTop = 0.1

Gauge.prototype.paddingBottom = 0.1

Gauge.prototype.percentColors = null

Gauge.prototype.options = {
  colorStart: "#6fadcf",
  colorStop: void 0,
  gradientType: 0,
  strokeColor: "#e0e0e0",
  pointer: {
    length: 0.8,
    strokeWidth: 0.035,
    iconScale: 1.0,
  },
  angle: 0.15,
  lineWidth: 0.44,
  radiusScale: 1.0,
  limitMax: false,
  limitMin: false,
}

Gauge.prototype.setOptions = function (options) {
  var gauge, j, len, phi, ref
  if (options == null) {
    options = null
  }
  Gauge.__super__.setOptions.call(this, options)
  this.configPercentColors()
  this.extraPadding = 0
  if (this.options.angle < 0) {
    phi = Math.PI * (1 + this.options.angle)
    this.extraPadding = Math.sin(phi)
  }
  this.availableHeight = this.canvas.height * (1 - this.paddingTop - this.paddingBottom)
  this.lineWidth = this.availableHeight * this.options.lineWidth
  this.radius = (this.availableHeight - this.lineWidth / 2) / (1.0 + this.extraPadding)
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  ref = this.gp
  for (j = 0, len = ref.length; j < len; j++) {
    gauge = ref[j]
    gauge.setOptions(this.options.pointer)
    gauge.render()
  }
  this.render()
  return this
}

Gauge.prototype.configPercentColors = function () {
  var bval, gval, i, j, ref, results, rval
  this.percentColors = null
  if (this.options.percentColors !== void 0) {
    this.percentColors = new Array()
    results = []
    for (
      i = j = 0, ref = this.options.percentColors.length - 1;
      0 <= ref ? j <= ref : j >= ref;
      i = 0 <= ref ? ++j : --j
    ) {
      rval = parseInt(cutHex(this.options.percentColors[i][1]).substring(0, 2), 16)
      gval = parseInt(cutHex(this.options.percentColors[i][1]).substring(2, 4), 16)
      bval = parseInt(cutHex(this.options.percentColors[i][1]).substring(4, 6), 16)
      results.push(
        (this.percentColors[i] = {
          pct: this.options.percentColors[i][0],
          color: {
            r: rval,
            g: gval,
            b: bval,
          },
        })
      )
    }
    return results
  }
}

Gauge.prototype.set = function (value) {
  var gp, i, j, l, len, m, ref, ref1, val
  if (!(value instanceof Array)) {
    value = [value]
  }
  for (
    i = j = 0, ref = value.length - 1;
    0 <= ref ? j <= ref : j >= ref;
    i = 0 <= ref ? ++j : --j
  ) {
    value[i] = this.parseValue(value[i])
  }
  if (value.length > this.gp.length) {
    for (
      i = l = 0, ref1 = value.length - this.gp.length;
      0 <= ref1 ? l < ref1 : l > ref1;
      i = 0 <= ref1 ? ++l : --l
    ) {
      gp = new GaugePointer(this)
      gp.setOptions(this.options.pointer)
      this.gp.push(gp)
    }
  } else if (value.length < this.gp.length) {
    this.gp = this.gp.slice(this.gp.length - value.length)
  }
  i = 0
  for (m = 0, len = value.length; m < len; m++) {
    val = value[m]
    if (val > this.maxValue) {
      if (this.options.limitMax) {
        val = this.maxValue
      } else {
        this.maxValue = val + 1
      }
    } else if (val < this.minValue) {
      if (this.options.limitMin) {
        val = this.minValue
      } else {
        this.minValue = val - 1
      }
    }
    this.gp[i].value = val
    this.gp[i++].setOptions({
      minValue: this.minValue,
      maxValue: this.maxValue,
      angle: this.options.angle,
    })
  }
  this.value = Math.max(Math.min(value[value.length - 1], this.maxValue), this.minValue)
  AnimationUpdater.add(this)
  AnimationUpdater.run(this.forceUpdate)
  return (this.forceUpdate = false)
}

Gauge.prototype.getAngle = function (value) {
  return (
    (1 + this.options.angle) * Math.PI +
    ((value - this.minValue) / (this.maxValue - this.minValue)) *
      (1 - this.options.angle * 2) *
      Math.PI
  )
}

Gauge.prototype.getColorForPercentage = function (pct, grad) {
  var color, endColor, i, j, rangePct, ref, startColor
  if (pct === 0) {
    color = this.percentColors[0].color
  } else {
    color = this.percentColors[this.percentColors.length - 1].color
    for (
      i = j = 0, ref = this.percentColors.length - 1;
      0 <= ref ? j <= ref : j >= ref;
      i = 0 <= ref ? ++j : --j
    ) {
      if (pct <= this.percentColors[i].pct) {
        if (grad === true) {
          startColor = this.percentColors[i - 1] || this.percentColors[0]
          endColor = this.percentColors[i]
          rangePct = (pct - startColor.pct) / (endColor.pct - startColor.pct)
          color = {
            r: Math.floor(startColor.color.r * (1 - rangePct) + endColor.color.r * rangePct),
            g: Math.floor(startColor.color.g * (1 - rangePct) + endColor.color.g * rangePct),
            b: Math.floor(startColor.color.b * (1 - rangePct) + endColor.color.b * rangePct),
          }
        } else {
          color = this.percentColors[i].color
        }
        break
      }
    }
  }
  return "rgb(" + [color.r, color.g, color.b].join(",") + ")"
}

Gauge.prototype.getColorForValue = function (val, grad) {
  var pct
  pct = (val - this.minValue) / (this.maxValue - this.minValue)
  return this.getColorForPercentage(pct, grad)
}

Gauge.prototype.renderTicks = function (ticksOptions, w, h, radius) {
  var currentDivision,
    currentSubDivision,
    divColor,
    divLength,
    divWidth,
    divisionCount,
    j,
    lineWidth,
    range,
    rangeDivisions,
    ref,
    results,
    scaleMutate,
    st,
    subColor,
    subDivisions,
    subLength,
    subWidth,
    subdivisionCount,
    t,
    tmpRadius
  if (ticksOptions !== {}) {
    divisionCount = ticksOptions.divisions || 0
    subdivisionCount = ticksOptions.subDivisions || 0
    divColor = ticksOptions.divColor || "#fff"
    subColor = ticksOptions.subColor || "#fff"
    divLength = ticksOptions.divLength || 0.7
    subLength = ticksOptions.subLength || 0.2
    range = parseFloat(this.maxValue) - parseFloat(this.minValue)
    rangeDivisions = parseFloat(range) / parseFloat(ticksOptions.divisions)
    subDivisions = parseFloat(rangeDivisions) / parseFloat(ticksOptions.subDivisions)
    currentDivision = parseFloat(this.minValue)
    currentSubDivision = 0.0 + subDivisions
    lineWidth = range / 400
    divWidth = lineWidth * (ticksOptions.divWidth || 1)
    subWidth = lineWidth * (ticksOptions.subWidth || 1)
    results = []
    for (t = j = 0, ref = divisionCount + 1; j < ref; t = j += 1) {
      this.ctx.lineWidth = this.lineWidth * divLength
      scaleMutate = (this.lineWidth / 2) * (1 - divLength)
      tmpRadius = this.radius * this.options.radiusScale + scaleMutate
      this.ctx.strokeStyle = divColor
      this.ctx.beginPath()
      this.ctx.arc(
        0,
        0,
        tmpRadius,
        this.getAngle(currentDivision - divWidth),
        this.getAngle(currentDivision + divWidth),
        false
      )
      this.ctx.stroke()
      currentSubDivision = currentDivision + subDivisions
      currentDivision += rangeDivisions
      if (t !== ticksOptions.divisions && subdivisionCount > 0) {
        results.push(
          function () {
            var l, ref1, results1
            results1 = []
            for (st = l = 0, ref1 = subdivisionCount - 1; l < ref1; st = l += 1) {
              this.ctx.lineWidth = this.lineWidth * subLength
              scaleMutate = (this.lineWidth / 2) * (1 - subLength)
              tmpRadius = this.radius * this.options.radiusScale + scaleMutate
              this.ctx.strokeStyle = subColor
              this.ctx.beginPath()
              this.ctx.arc(
                0,
                0,
                tmpRadius,
                this.getAngle(currentSubDivision - subWidth),
                this.getAngle(currentSubDivision + subWidth),
                false
              )
              this.ctx.stroke()
              results1.push((currentSubDivision += subDivisions))
            }
            return results1
          }.call(this)
        )
      } else {
        results.push(void 0)
      }
    }
    return results
  }
}

Gauge.prototype.render = function () {
  var displayedAngle,
    fillStyle,
    gauge,
    h,
    j,
    l,
    len,
    len1,
    max,
    min,
    radius,
    ref,
    ref1,
    scaleMutate,
    tmpRadius,
    w,
    zone
  w = this.canvas.width / 2
  h =
    this.canvas.height * this.paddingTop +
    this.availableHeight -
    (this.radius + this.lineWidth / 2) * this.extraPadding
  displayedAngle = this.getAngle(this.displayedValue)

  this.ctx.lineCap = "butt"
  radius = this.radius * this.options.radiusScale
  if (this.options.staticZones) {
    this.ctx.save()
    this.ctx.translate(w, h)
    this.ctx.lineWidth = this.lineWidth
    ref = this.options.staticZones
    for (j = 0, len = ref.length; j < len; j++) {
      zone = ref[j]
      min = zone.min
      if (this.options.limitMin && min < this.minValue) {
        min = this.minValue
      }
      max = zone.max
      if (this.options.limitMax && max > this.maxValue) {
        max = this.maxValue
      }
      tmpRadius = this.radius * this.options.radiusScale
      if (zone.height) {
        this.ctx.lineWidth = this.lineWidth * zone.height
        scaleMutate = (this.lineWidth / 2) * (zone.offset || 1 - zone.height)
        tmpRadius = this.radius * this.options.radiusScale + scaleMutate
      }
      this.ctx.strokeStyle = zone.strokeStyle
      this.ctx.beginPath()
      this.ctx.arc(0, 0, tmpRadius, this.getAngle(min), this.getAngle(max), false)
      this.ctx.stroke()
    }
  } else {
    if (this.options.customFillStyle !== void 0) {
      fillStyle = this.options.customFillStyle(this)
    } else if (this.percentColors !== null) {
      fillStyle = this.getColorForValue(this.displayedValue, this.options.generateGradient)
    } else if (this.options.colorStop !== void 0) {
      if (this.options.gradientType === 0) {
        fillStyle = this.ctx.createRadialGradient(w, h, 9, w, h, 70)
      } else {
        fillStyle = this.ctx.createLinearGradient(0, 0, w, 0)
      }
      fillStyle.addColorStop(0, this.options.colorStart)
      fillStyle.addColorStop(1, this.options.colorStop)
    } else {
      fillStyle = this.options.colorStart
    }
    this.ctx.strokeStyle = fillStyle
    this.ctx.beginPath()
    this.ctx.arc(w, h, radius, (1 + this.options.angle) * Math.PI, displayedAngle, false)
    this.ctx.lineWidth = this.lineWidth
    this.ctx.stroke()
    this.ctx.strokeStyle = this.options.strokeColor
    this.ctx.beginPath()
    this.ctx.arc(w, h, radius, displayedAngle, (2 - this.options.angle) * Math.PI, false)
    this.ctx.stroke()
    this.ctx.save()
    this.ctx.translate(w, h)
  }
  if (this.options.renderTicks) {
    this.renderTicks(this.options.renderTicks, w, h, radius)
  }
  this.ctx.restore()
  this.ctx.translate(w, h)
  ref1 = this.gp
  for (l = 0, len1 = ref1.length; l < len1; l++) {
    gauge = ref1[l]
    gauge.update(true)
  }
  return this.ctx.translate(-w, -h)
}

const AnimationUpdater = {
  elements: [],
  animId: null,
  addAll: function (list) {
    var elem, j, len, results
    results = []
    for (j = 0, len = list.length; j < len; j++) {
      elem = list[j]
      results.push(AnimationUpdater.elements.push(elem))
    }
    return results
  },
  add: function (object) {
    if (AnimationUpdater.elements.indexOf(object) < 0) {
      return AnimationUpdater.elements.push(object)
    }
  },
  run: function (force) {
    var elem, finished, isCallback, j, k, l, len, ref, toRemove
    if (force == null) {
      force = false
    }
    isCallback = isFinite(parseFloat(force))
    if (isCallback || force === true) {
      finished = true
      toRemove = []
      ref = AnimationUpdater.elements
      for (k = j = 0, len = ref.length; j < len; k = ++j) {
        elem = ref[k]
        if (elem.update(force === true)) {
          finished = false
        } else {
          toRemove.push(k)
        }
      }
      for (l = toRemove.length - 1; l >= 0; l += -1) {
        k = toRemove[l]
        AnimationUpdater.elements.splice(k, 1)
      }
      return (AnimationUpdater.animId = finished
        ? null
        : requestAnimationFrame(AnimationUpdater.run))
    } else if (force === false) {
      if (AnimationUpdater.animId === !null) {
        cancelAnimationFrame(AnimationUpdater.animId)
      }
      return (AnimationUpdater.animId = requestAnimationFrame(AnimationUpdater.run))
    }
  },
}

export default Gauge
