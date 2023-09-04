var std1 = `
function verifyValueType(value, typeSchema) {
    switch(typeSchema[0]) {
        case Boolean:
            if(typeof value != 'boolean')
                return false
            break

        case Number:
            if(typeof value != 'number')
                return false
            break

        case String:
            if(typeof value != 'string')
                return false
            break

        case Component:
            if(typeof value != 'function')
                return false
            break

        case Object:
            if(typeof value != 'object')
                return false
            break

        case Array:
            if(!Array.isArray(value))
                return false
            break
    }

    return true
}

function AnonimComponent(properties) {
    var name = properties.name || 'AnonimComponent'
    var structure = properties.structure || []
    var inputs = properties.inputs || []
    var outputs = properties.outputs || []
    var create = properties.create || function() {}
    var init = properties.init || function() {}
    var destroy = properties.destroy || function() {}
    var onChange = properties.change || {}

    return function(parentElement, attributes) {
        if(!attributes)
            attributes = {}

        var children = []

        var ComponentSelf = eval('function _' + name + '(){this.element = null}; _' + name)
        var selfPrototype = {
            get parentElement() {return parentElement},
            get outerNode() {return node}
        }
        eval('_' + name + '.prototype = selfPrototype')
        var self = eval('new _' + name + '()')

        var ComponentNode = eval('function ' + name + '(){}; name')
        var nodePrototype = {
            get self() {return self},
            get name() {return name},
            get children() {return children},
            get element() {return self.element},
            get inputs() {return inputs},
            get outputs() {return outputs},
            get destroy() {
                return function() {
                    children.forEach(function(child) { child.destroy() })

                    try { destroy.call(self) }
                    catch(error){ console.error('error in ' + name + ' ' + key + ' destroy: ' + error.message) }
                }
            }
        }
        eval(name + '.prototype = nodePrototype')
        var node = eval('new ' + name + '()')

        inputs.forEach(function(input) {
            var inputName = input[0]

            nodePrototype.__defineGetter__(inputName, function() {return self[inputName]})

            nodePrototype.__defineSetter__(inputName, function(newValue) {
                if(!verifyValueType(newValue, [input[1]])) {
                    console.error('error in ' + name + ' ' + inputName + ' change: incompatible type. New value is ' + newValue)
                }

                var changeListener = onChange[inputName]

                if(changeListener) {
                    try{ changeListener.call(self, newValue) }
                    catch(error) { console.error('error in ' + name + ' ' + inputName + ' change: ' + error.message, error.stack) }
                }

                self[inputName] = newValue

                return newValue
            })
        })

        var outputListeners = new Array(outputs.length)

        outputs.forEach(function(output, index) {
            var outputSender = function(data) {
                var listener = outputListeners[index]

                if(listener)
                    listener(data)
            }

            selfPrototype.__defineGetter__(output, function() {
                return outputSender
            })

            nodePrototype.__defineSetter__(output, function(newOutputListener) {
                outputListeners[index] = newOutputListener
                return newOutputListener
            })
        })

        try { create.call(self) }
        catch(error) { console.error('error in ' + name + ' create: ' + error.message) }

        structure.forEach(function(structureNode) {
            var referenceName
            var component
            var attributes

            referenceName = structureNode[0]

            if(typeof referenceName == 'string') {
                component = structureNode[1]
                attributes = structureNode[2]
            }
            else {
                referenceName = undefined
                component = structureNode[0]
                attributes = structureNode[1]
            }

            var child = component(self.element || parentElement, attributes)
            children.push(child)

            if(referenceName)
                selfPrototype.__defineGetter__(referenceName, function() {return child})
        })

        inputs.forEach(function(input) {
            var inputName = input[0]

            if(inputName in attributes)
                node[inputName] = attributes[inputName]
            else {
                if(input.length == 3)
                    node[inputName] = input[2]
            }
        })

        try { init.call(self) }
        catch(error) { console.error('error in ' + name + ' init: ' + error.message) }

        return node
    }
}

var components = {}

function Component(params) {
    var component = AnonimComponent(params)
    components[params.name || 'AnonimComponent'] = component
    return component
}`

var std2 = `
/////////////////////// Атомарные ///////////////////////////////////////////

var List = AnonimComponent({
    name: 'List',

    inputs: [
        ['template', Component],
        ['context'],
        ['items', Array]
    ],
    outputs: ['itemChanged', 'itemInserted', 'itemDeleted'],

    create: function() {
        var self = this

        this.views = []

        this.initItems = function(items) {
            self.views.forEach(function(view){ view.destroy() })
            self.views = []

            items.forEach(function(item) {
                var view = self.template(self.parentElement, {value: item, context: self.context})
                //view.context = self.context
                //view.value = item
                view.valueChanged = function(data) {
                    self.itemChanged({
                        data,
                        index: self.views.indexOf(view),
                        context: self.context
                    })
                }

                self.views.push(view)
                self.itemInserted(item, self.views.length - 1)
            })

            if(!items.subscriptions)
                items.subscriptions = [self]
            else
                items.subscriptions.push(self)
                
            if(!(items.delete)) {
                items.delete = function(index) {
                    this.subscriptions.forEach(function(subscription) {
                        subscription.views[index].destroy()
                        subscription.views.splice(index, 1)
                        subscription.itemDeleted(index)
                    })
                
                    return this.splice(index, 1)[0]
                }
            }
                
            if(!(items.insert)) {
                items.insert = function(value, index) {
                    if(typeof index == 'undefined') {
                        this.subscriptions.forEach(function(subscription) {
                            var view = subscription.template(subscription.parentElement, {value: value, context: subscription.context})
                            //view.context = subscription.context
                            //view.value = value
                            view.valueChanged = function(data) {
                                subscription.itemChanged({
                                    data,
                                    index: subscription.views.indexOf(view),
                                    context: subscription.context
                                })
                            }
                
                            subscription.views.push(view)
                            subscription.itemInserted(value, subscription.views.length)
                        })
                
                        this.push(value)
                    }
                    else {
                        this.subscriptions.forEach(function(subscription) {
                            subscription.views.forEach(function(view){ view.destroy() })
                            subscription.views = []
                        })

                        this.splice(index, 0, value)
                            
                        this.forEach(function(value) {
                            this.subscriptions.forEach(function(subscription) {
                                var view = subscription.template(subscription.parentElement, {value: value, context: subscription.context})
                                //view.context = subscription.context
                                //view.value = value
                                view.valueChanged = function(data) {
                                    subscription.itemChanged({
                                        data,
                                        index: subscription.views.indexOf(view),
                                        context: subscription.context
                                    })
                                }

                                subscription.views.push(view)
                                subscription.itemInserted(value, index)
                            })
                        })
                    }
                }
            }
        }
    },

    init: function() {

    },

    change: {
        items: function(items) {
            this.initItems(items)
        }
    },

    destroy: function() {
        if(this.items)
            this.items.subscriptions.splice(this.items.subscriptions.indexOf(this), 1)

        this.views.forEach(function(view){ view.destroy() })
        this.views = undefined
    }
})

var Text = Component({
    name: 'Text',
    
    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 0],
        ['height', Number, 19],
        ['value', String, ''],
        ['family', String, 'Arial'],
        ['style', ['normal', 'italic', 'oblique'], 'normal'],
        ['weight', ['400', '600'], '400'],
        ['size', Number, 14],
        ['whiteSpace', ['initial', 'nowrap'], 'nowrap'],
        ['cursor', ['default', 'pointer'], 'default'],
        ['userSelect', ['initial', 'none'], 'initial'],
        ['color', String, '#000']
    ],
    outputs: ['widthChanged', 'click', 'mousemove' , 'mouseover', 'mouseleave', 'mousedown', 'mouseup'],

    create: function() {
        this.element = document.createElement('span')
        this.textNode = document.createTextNode('')
        this.element.appendChild(this.textNode)
        this.parentElement.appendChild(this.element)

        this.updateWidth = function() {
            this.width = this.element.clientWidth
            this.widthChanged(this.width)
        }
    },

    init: function() {
        this.textNode.data = this.value || 'text'

        with(this.element.style) {
            position = 'absolute'
            left = this.x + 'px'
            top = this.y + 'px'
            lineHeight = this.height + 'px'
            fontFamily = this.family
            fontStyle = this.style
            fontWeight = this.weight
            fontSize = this.size + 'px'
            whiteSpace = this.whiteSpace
            cursor = this.cursor
            userSelect = this.userSelect
            color = this.color
        }

        this.updateWidth()

        var self = this
        this.element.onclick = function(event){self.click(event)}
        this.element.onmouseover = function(event){self.mouseover(event)}
        this.element.onmouseleave = function(event){self.mouseleave(event)}
        this.element.onmousemove = function(event){self.mousemove(event)}
        this.element.onmousedown = function(event){self.mousedown(event)}
        this.element.onmouseup = function(event){self.mouseup(event)}
    },

    change: {
        x: function(x) {
            this.element.style.left = x + 'px'
        },

        y: function(y) {
            this.element.style.top = y + 'px'
        },

        width: function(width) {

        },

        height: function(height) {
            this.element.style.lineHeight = height + 'px'
            this.updateWidth()
        },

        value: function(value) {
            this.textNode.data = value
            this.updateWidth()
        },

        family: function(family) {
            this.element.style.fontFamily = family
            this.updateWidth()
        },

        style: function(style) {
            this.element.style.fontStyle = style
            this.updateWidth()
        },

        weight: function(weight) {
            this.element.style.fontWeight = weight
            this.updateWidth()
        },

        size: function(size) {
            this.element.style.fontSize = size + 'px'
            this.updateWidth()
        },

        whiteSpace: function(whiteSpace) {
            this.element.style.whiteSpace = whiteSpace
            this.updateWidth()
        },

        cursor: function(cursor) {
            this.element.style.cursor = cursor
        },

        userSelect: function(userSelect) {
            this.element.style.userSelect = userSelect
        },

        color: function(color) {
            this.element.style.color = color
        }
    },

    destroy: function() {
        this.element.removeChild(this.textNode)
        this.parentElement.removeChild(this.element)
    }
})

var Input = Component({
    name: 'Input',

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 200],
        ['height', Number, 34],
        ['value', undefined, ''],
        ['placeholder', String, '']
    ],
    outputs: ['valueChanged'],

    create: function() {
        this.element = document.createElement('input')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        with(this.element.style) {
            position = 'absolute'
            left = this.x + 'px'
            top = this.y + 'px'

            display = 'inline-flex'
            width = this.width + 'px'
            height = '32px'
            padding = '0 11px 1px'

            borderRadius = '4px'
            border = 'var(--ux-ng2-text-field-border-width,1px) solid var(--ux-ng2-text-field-border-color, #ccd2d9)'

            outline = 'none'

            fontSize = '1rem'
            fontFamily = 'Arial,sans-serif'

            caretColor = '#262626'
            background = 'none'
            color = '#262626'

            transition = 'border-color .2s,background-color .2s,box-shadow .2s,-webkit-box-shadow .2s'
            backgroundColor = 'var(--ux-ng2-text-field-background-color, #fff)'
            boxShadow = 'inset 0 2px 2px 0 rgba(0,0,0,.07)'
        }

        this.element.placeholder = this.placeholder
        this.element.value = this.value

        var self = this
        self.element.oninput = function(event) {
            self.valueChanged(self.element.value)
        }
    },

    change: {
        x: function(x) {
            this.element.style.left = x + 'px'
        },

        y: function(y) {
            this.element.style.top = y + 'px'
        },

        width: function(width) {
            this.element.style.width = width - 22 + 'px'
        },

        value: function(value) {
            this.element.value = value
        },

        placeholder: function(placeholder) {
            this.element.placeholder = placeholder
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Rectangle = Component({
    name: 'Rectangle',

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 100],
        ['height', Number, 100],
        ['color', String, '#123'],
        ['boxShadow', String, 'initial'],
        ['border', String, 'none'],
        ['borderRadius', Number, 0],
        ['outline', String, 'none'],
        ['backgroundImage', String, 'none'],
        ['cursor', ['default', 'pointer'], 'default'],
        ['draggable', Boolean, false]
    ],
    outputs: [
        'click',
        'doubleclick',
        'mousemove',
        'mouseover',
        'mouseleave',
        'mousedown',
        'mouseup',
        'dragstart',
        'dragend',

        'dragover',
        'dragenter',
        'drop',

        'touchstart',
        'touchend',
        'touchmove'
    ],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        with(this.element.style) {
            display = 'inline-block'
            position = 'absolute'
            left = this.x + 'px'
            top = this.y + 'px'

            width = this.width + 'px'
            height = this.height + 'px'
            backgroundColor = this.color
            boxShadow = this.boxShadow
            border = this.border
            borderRadius = this.borderRadius + 'px'
            outline = this.outline
            backgroundImage = this.backgroundImage
            cursor = this.cursor
        }

        this.element.setAttribute('draggable', this.draggable)

        var self = this
        this.element.onclick = function(event){self.click(event)}
        this.element.ondblclick = function(event){self.doubleclick(event)}
        this.element.onmouseover = function(event){self.mouseover(event)}
        this.element.onmouseleave = function(event){self.mouseleave(event)}
        this.element.onmousemove = function(event){self.mousemove(event)}
        this.element.onmousedown = function(event){self.mousedown(event)}
        this.element.onmouseup = function(event){self.mouseup(event)}
        this.element.ondragstart = function(event){self.dragstart(event)}
        this.element.ondragend = function(event){self.dragend(event)}
        this.element.ondragover = function(event){self.dragover(event)}
        this.element.ondragenter = function(event){self.dragenter(event)}
        this.element.ondrop = function(event){self.drop(event)}
        this.element.ontouchstart = function(event){self.touchstart(event)}
        this.element.ontouchend = function(event){self.touchend(event)}
        this.element.ontouchmove = function(event){self.touchmove(event)}
    },

    change: {
        x: function(x) {
            this.element.style.left = x + 'px'
        },

        y: function(y) {
            this.element.style.top = y + 'px'
        },

        width: function(width) {
            this.element.style.width = width + 'px'
        },

        height: function(height) {
            this.element.style.height = height + 'px'
        },

        color: function(color) {
            this.element.style.backgroundColor = color
        },

        boxShadow: function(boxShadow) {
            this.element.style.boxShadow = boxShadow
        },

        border: function(border) {
            this.element.style.border = border
        },

        borderRadius: function(borderRadius) {
            this.element.style.borderRadius = borderRadius + 'px'
        },

        outline: function(outline) {
            this.element.style.outline = outline
        },

        backgroundImage: function(backgroundImage) {
            this.element.style.backgroundImage = backgroundImage
        },

        cursor: function(cursor) {
            this.element.style.cursor = cursor
        },

        draggable: function(draggable) {
            this.element.setAttribute('draggable', draggable)
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Scroller = AnonimComponent({
    name: 'Scroller',

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 150],
        ['height', Number, 100],
        ['scrollX', Number, 0],
        ['scrollY', Number, 0],
        ['inner', Component],
        ['innerWidth', Number, 151],
        ['innerHeight', Number, 101]
    ],

    create: function() {
        this.element = document.createElement('div')
        this.scrollElement = document.createElement('div')
        this.element.appendChild(this.scrollElement)
        this.containerElement = document.createElement('div')
        this.scrollElement.appendChild(this.containerElement)
        this.resizeElement = document.createElement('iframe')
        this.containerElement.appendChild(this.resizeElement)
        this.verticalScrollElement = document.createElement('div')
        this.element.appendChild(this.verticalScrollElement)
        this.horizontalScrollElement = document.createElement('div')
        this.element.appendChild(this.horizontalScrollElement)
        this.parentElement.appendChild(this.element)

        this.updateSlidersVisibility = function() {
            if(this.element.clientHeight < this.containerElement.scrollHeight)
                this.verticalScrollElement.style.display = 'inline-block'
            else
                this.verticalScrollElement.style.display = 'none'

            if(this.element.clientWidth < this.containerElement.scrollWidth)
                this.horizontalScrollElement.style.display = 'inline-block'
            else
                this.horizontalScrollElement.style.display = 'none'

            this.scroll(this.scrollX, this.scrollY)
        }

        this.scroll = function(scrollX, scrollY) {
            this.scrollX = scrollX
            this.scrollY = scrollY

            if(scrollY < 0)
                scrollY = 0

            if(scrollX < 0)
                scrollX = 0

            if(scrollX > (this.containerElement.scrollWidth - this.element.clientWidth))
                scrollX = (this.containerElement.scrollWidth - this.element.clientWidth)

            if(scrollY > (this.containerElement.scrollHeight - this.element.clientHeight))
                scrollY = (this.containerElement.scrollHeight - this.element.clientHeight)

            this.scrollElement.scroll(scrollX, scrollY)

            var scrollXPercentage = scrollX / (this.containerElement.scrollWidth - this.element.clientWidth) || 0
            var horizontalScrollWidth = this.element.clientWidth - this.horizontalScrollElement.clientWidth
            this.horizontalScrollElement.style.left = scrollXPercentage * horizontalScrollWidth + 'px'

            var scrollYPercentage = scrollY / (this.containerElement.scrollHeight - this.element.clientHeight) || 0
            var verticalScrollHeight = this.element.clientHeight - this.verticalScrollElement.clientHeight
            this.verticalScrollElement.style.top = scrollYPercentage * verticalScrollHeight + 'px'
        }
    },

    init: function() {
        with(this.element.style) {
            display = 'inline-block'
            position = 'absolute'
            left = this.x + 'px'
            top = this.y + 'px'

            width = this.width + 'px'
            height = this.height + 'px'
        }

        with(this.scrollElement.style) {
            position = 'relative'
            overflow = 'hidden'
            width = '100%'
            height = '100%'
        }

        with(this.resizeElement.style) {
            position = 'absolute'
            left = '0'
            top = '0'
            width = '100%'
            height = '100%'

            border = 'none'
            zIndex = '0'
        }

        with(this.containerElement.style) {
            display = 'inline-block'
            position = 'relative'
            width = this.innerWidth + 'px'
            height = this.innerHeight + 'px'
            zIndex = '1'
        }

        with(this.verticalScrollElement.style) {
            position = 'absolute'
            display = 'none'
            width = '10px'
            height = '100px'
            top = '0'
            right = '0'
            backgroundColor = '#bac0c8'
            borderRadius = '10px'
            //border = '1px solid rgb(213, 219, 228)'
            userSelect = 'none'
            zIndex = '2'
        }

        with(this.horizontalScrollElement.style) {
            position = 'absolute'
            display = 'none'
            width = '100px'
            height = '10px'
            bottom = '0'
            left = '0'
            backgroundColor = '#bac0c8'
            borderRadius = '10px'
            //border = '1px solid rgb(213, 219, 228)'
            userSelect = 'none'
            zIndex = '2'
        }

        var self = this

        this.scrollY = this.scrollY || 0
        this.scrollX = this.scrollX || 0

        this.verticalScrollElement.onmousedown = function(event) {
            self.dragCoords = {
                x: event.x || event.clientX,
                y: event.y || event.clientY,
                scroll: self.scrollY,
                isVertical: true
            }

            self.verticalScrollElement.style.backgroundColor = 'rgb(140, 144, 150)'
        }

        this.verticalScrollElement.onmouseup = function(event) {
            self.verticalScrollElement.style.backgroundColor = '#bac0c8'
        }

        this.horizontalScrollElement.onmousedown = function(event) {
            self.dragCoords = {
                x: event.x || event.clientX,
                y: event.y || event.clientY,
                scroll: self.scrollX,
                isVertical: false
            }

            self.horizontalScrollElement.style.backgroundColor = 'rgb(140, 144, 150)'
        }

        this.horizontalScrollElement.onmouseup = function(event) {
            self.horizontalScrollElement.style.backgroundColor = '#bac0c8'
        }

        this.mouseupSubscription = subscribe('onmouseup', function(event) {
            self.dragCoords = undefined
            self.verticalScrollElement.style.backgroundColor = '#bac0c8'
            self.horizontalScrollElement.style.backgroundColor = '#bac0c8'
        })

        this.containerElement.onmousewheel = function(event) {
            event.preventDefault()
            var scrollY = self.scrollY

            if(scrollY < 0)
                scrollY = 0

            if(scrollY > (self.containerElement.scrollHeight - self.element.clientHeight))
                scrollY = (self.containerElement.scrollHeight - self.element.clientHeight)

            self.scroll(self.scrollX, scrollY + event.deltaY)
        }

        this.updateSlidersVisibility()

        this.mousemoveSubscription = subscribe('onmousemove', function(event) {
            if(self.dragCoords) {
                var eventX = event.x || event.clientX
                var eventY = event.y || event.clientY

                if(self.dragCoords.isVertical) {
                    var verticalScrollHeight = self.element.clientHeight - self.verticalScrollElement.clientHeight
                    var scrollDelta = eventY - self.dragCoords.y
                    var scrollPercentage = scrollDelta / verticalScrollHeight

                    var scrollY = self.dragCoords.scroll

                    if(scrollY < 0)
                        scrollY = 0

                    if(scrollY > (self.containerElement.scrollHeight - self.element.clientHeight))
                        scrollY = (self.containerElement.scrollHeight - self.element.clientHeight)

                    self.scroll(self.scrollX, scrollY + scrollPercentage * (self.containerElement.scrollHeight - self.element.clientHeight))
                }
                else {
                    var horizontalScrollWidth = self.element.clientWidth - self.horizontalScrollElement.clientWidth
                    var scrollDelta = eventX - self.dragCoords.x
                    var scrollPercentage = scrollDelta / horizontalScrollWidth

                    var scrollX = self.dragCoords.scroll

                    if(scrollX < 0)
                        scrollX = 0

                    if(scrollX > (self.containerElement.scrollWidth - self.element.clientWidth))
                        scrollX = (self.containerElement.scrollWidth - self.element.clientWidth)

                    self.scroll(scrollX + scrollPercentage * (self.containerElement.scrollWidth - self.element.clientWidth), self.scrollY)
                }
            }
        })

        this.resizeElement.contentWindow.onresize = function() {
            self.updateSlidersVisibility()
        }

        /*if(this.inner) {
            this.innerView = this.inner(this.containerElement)
            this.updateSlidersVisibility()
        }*/
    },

    change: {
        x: function(x) {
            this.element.style.left = x + 'px'
            //this.containerElement.style.left = x + 'px'
        },

        y: function(y) {
            this.element.style.top = y + 'px'
            //this.containerElement.style.top = y + 'px'
        },

        width: function(width) {
            this.element.style.width = width + 'px'
            this.updateSlidersVisibility()
        },

        height: function(height) {
            this.element.style.height = height + 'px'
            this.updateSlidersVisibility()
        },

        inner: function(inner) {
            if(this.innerView)
                this.innerView.destroy()

            this.innerView = inner(this.containerElement)
            this.updateSlidersVisibility()
        },

        innerWidth: function(innerWidth) {
            this.containerElement.style.width = innerWidth + 'px'
        },

        innerHeight: function(innerHeight) {
            this.containerElement.style.height = innerHeight + 'px'
        }
    },

    destroy: function() {
        if(this.innerView)
            this.innerView.destroy()

        this.parentElement.removeChild(this.element)
        this.mouseupSubscription.unsubscribe()
        this.mousemoveSubscription.unsubscribe()
    }
})

/////////////////////// Атомарные2 //////////////////////////////////////////

var Button = AnonimComponent({
    name: 'Button',
    structure: [
        ['wrapper', Rectangle, {
            height: 32,
            color: '#fff',
            boxShadow: '0 1px 1px 0 rgba(0,0,0,.06)',
            border: 'var(--ux-ng2-button-default-border-size,1px) solid var(--ux-ng2-button-default-border-color,#ccd2d9)',
            borderRadius: 4,
            cursor: 'pointer',
            backgroundImage: 'var(--ux-ng2-button-default-background-image,linear-gradient(to bottom,#fff,#f5f6f7))'
        }],
        ['textElement', Text, {
            height: 32,
            cursor: 'pointer',
            userSelect: 'none'
        }]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['text', String, 'Click']
    ],

    outputs: ['click'],

    create: function() {
        this.updatePosition = function(x, y) {
            this.wrapper.x = x
            this.wrapper.y = y

            this.textElement.x = 23 + this.wrapper.x
            this.textElement.y = this.wrapper.y

            this.wrapper.width = this.textElement.width + 23 + 23
        }
    },

    init: function() {
        this.textElement.value = this.text
        this.updatePosition(this.x, this.y)

        var self = this
        this.wrapper.click = this.textElement.click = function() {
            self.click()
        }

        this.wrapper.mouseover = this.textElement.mouseover = function() {
            self.wrapper.backgroundImage = 'var(--ux-ng2-button-default-hover-background-image, linear-gradient(to bottom, #f0f1f2, #e8e9eb))'
        }

        this.wrapper.mouseleave = this.textElement.mouseleave = function() {
            self.wrapper.backgroundImage = 'var(--ux-ng2-button-default-background-image,linear-gradient(to bottom,#fff,#f5f6f7))'
        }

        this.wrapper.mousedown = this.textElement.mousedown = function() {
            self.wrapper.backgroundImage = 'var(--ux-ng2-button-default-active-background-image, linear-gradient(to top, #f7f9fa, #e8e9eb))'
        }

        this.wrapper.mouseup = this.textElement.mouseup = function() {
            self.wrapper.backgroundImage = 'var(--ux-ng2-button-default-hover-background-image, linear-gradient(to bottom, #f0f1f2, #e8e9eb))'
        }
    },

    change: {
        x: function(x) {
            this.wrapper.x = x
            this.updatePosition(x, this.y)
        },

        y: function(y) {
            this.wrapper.y = y
            this.updatePosition(this.x, y)
        },
        
        text: function(text) {
            this.textElement.value = text
            this.wrapper.width = this.textElement.width + 23 + 23
        }
    }
})

var Popover = AnonimComponent({
    name: 'Popover',

    structure: [
        ['wrapper', Rectangle, {
            color: '#fff',
            boxShadow: '0 1px 1px 0 rgba(0,0,0,.08), 0 4px 16px 0 rgba(0,0,0,.04)',
            border: 'var(--ux-ng2-popover-inner-border-width,1px) solid var(--ux-ng2-popover-inner-border-color,#d4d7d9)',
            borderRadius: 4
        }]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 100],
        ['height', Number, 100],
        ['visible', Boolean, true]
    ],

    init: function() {
        this.wrapper.x = this.x
        this.wrapper.y = this.y
        this.wrapper.width = this.width
        this.wrapper.height = this.height
    },

    change: {
        x: function(x) {
            this.wrapper.x = x
        },

        y: function(y) {
            this.wrapper.y = y
        },

        width: function(width) {
            this.wrapper.width = width
        },

        height: function(height) {
            this.wrapper.height = height
        },
        
        visible: function(visible) {

        }
    }
})`

function build(component, components) {
	components = components.map(function(component) {
		return {
			name: component.name,
			structure: component.structure.map(function(structureElement) {
				return Object.keys(structureElement)
                    .reduce(function(structureElementCopy, itemName) {
                        structureElementCopy[itemName] = structureElement[itemName]
                        return structureElementCopy
                }, {})//{...structureElement}
			})
		}
	})

	var dependedComponents = []
	function updateDepended(component) {
		component.structure.forEach(structureElement => {
			var dependedComponent = components.find(function(currentComponent) {
				return currentComponent.name == structureElement.name
			})

			dependedComponent && updateDepended(dependedComponent)

			if(dependedComponents.indexOf(dependedComponent) == -1 && dependedComponent)
				dependedComponents.push(dependedComponent)
		})
	}
	updateDepended(component)

	var compiled = ';'

	function compileComponent(component) {
		var componentWidth = 0
		var componentHeight = 0

		component.structure.forEach(function(structureElement) {
			if(componentWidth < structureElement.properties.x + structureElement.properties.width)
				componentWidth = structureElement.properties.x + structureElement.properties.width

			if(componentHeight < structureElement.properties.y + structureElement.properties.height)
				componentHeight = structureElement.properties.y + structureElement.properties.height
		})

		var s = ''

		component.structure.forEach(structureElement => {
			s += `[${structureElement.name}, ${JSON.stringify(structureElement.properties)}],`
		})

		return `
var ${component.name} = Component({
	name: '${component.name}',
	structure: [${s}],
	inputs: [
		['x', Number, 0],
		['y', Number, 0],
		['width', Number, ${componentWidth}],
		['height', Number, ${componentHeight}]
	],
    create: function() {
        var self = this

        this.updateLayout = function() {
            self.outerNode.children.forEach(function(structureElement, index) {
                structureElement.x = self.x + ${JSON.stringify(component.structure)}[index].properties.x
                structureElement.y = self.y + ${JSON.stringify(component.structure)}[index].properties.y
            })
        }
    },
	init: function() {
							
	},
	change: {
		x: function(x) {
			this.x = x
			this.updateLayout()
		},

		y: function(y) {
			this.y = y
			this.updateLayout()
		},

		width: function(width) {
			this.width = width
			this.updateLayout()
		},

		height: function(height) {
			this.height = height
			this.updateLayout()
		}
	}
});

`
	}

	dependedComponents.forEach(component => {
		compiled += compileComponent(component)
	})

	compiled += compileComponent(component)

	return `${std1}; ${std2}; ${compiled}; ${component.name}(document.body)`
}