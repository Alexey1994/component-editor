var ControlPanel = AnonimComponent({
    name: 'ControlPanel',

    structure: [
        ['wrapper', Rectangle, {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: 50,
            color: '#2c2c2c'
        }],

        ['cleanButton', Button, {
            x: window.innerWidth - 100 - 100 - 80,
            y: 8,
            text: 'Clean'
        }],

        ['componentNameInput', Input, {
            x: window.innerWidth - 100 - 100 - 80 - 200 - 8,
            y: 8,
            placeholder: 'Component Name'
        }],

        ['createButton', Button, {
            x: window.innerWidth - 100 - 100 - 80,
            y: 8,
            text: 'Create'
        }],

        ['deployButton', Button, {
            x: window.innerWidth - 100,
            y: 8,
            text: 'Build'
        }]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, window.innerWidth],
        ['height', Number, 50],
        ['context']
    ],

    create: function() {
        this.updateLayout = function() {
            this.wrapper.width = this.width
            this.wrapper.height = this.height
            this.wrapper.x = this.x
            this.wrapper.y = this.y

            this.cleanButton.x = this.width - 100 - 100 - 130 - 200 - 8 - 150
            this.cleanButton.y = this.y + 8

            this.componentNameInput.x = this.width - 100 - 100 - 130 - 200 - 8
            this.componentNameInput.y = this.y + 8

            this.createButton.x = this.width - 100 - 100 - 130
            this.createButton.y = this.y + 8

            this.deployButton.x = this.width - 100
            this.createButton.y = this.y + 8
        }
    },

    init: function() {
        var self = this

        this.componentNameInput.valueChanged = function(componentName) {
            self.context.name = componentName
        }

        this.cleanButton.click = function() {
            self.context.selectedElement = undefined
            self.context.structure = []
            self.context.updateContext()
        }

        this.createButton.click = function() {
            var componentIndex = self.context.components.findIndex(function(component) {
                return component.name == self.context.name
            })

            var newComponent = {
                name: self.context.name,
                structure: self.context.structure
            }

            if(componentIndex == -1)
                self.context.components.push(newComponent)
            else
                self.context.components[componentIndex] = newComponent

            self.context.updateContext()
        }

        this.deployButton.click = function() {
            self.context.build()
        }
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
        },

        context: function(context) {
            this.componentNameInput.value = context.name
        }
    }
})

var Element = AnonimComponent({
    name: 'Element',

    structure: [
        ['wrapper', Rectangle, {
            width: 400,
            height: 100,
            draggable: true,
            cursor: 'grab',
            color: '#fff'
        }],
        ['text', Text]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 400],
        ['height', Number, 100],
        ['value', String]
    ],
    outputs: ['valueChanged'],

    init: function() {
        var self = this

        this.wrapper.dragstart = function(event) {
            event.dataTransfer.setData('component', self.value)
            self.wrapper.color = '#aaa'
        }

        this.wrapper.dragend = function(event) {
            self.wrapper.cursor = 'grab'
            self.wrapper.color = '#eeet'
        }

        this.wrapper.mouseover = function() {
            self.wrapper.color = '#eee'
        }

        this.wrapper.mouseleave = function() {
            self.wrapper.color = '#fff'
            self.wrapper.cursor = 'grab'
        }

        this.wrapper.mousedown = function() {
            self.wrapper.cursor = 'grabbing'
        }

        this.wrapper.mouseup = function() {
            self.wrapper.cursor = 'grab'
        }

        this.wrapper.doubleclick = function() {
            self.valueChanged(self.value)
        }
    },

    change: {
        x: function(x) {
            this.wrapper.x = x
            this.text.x = x + 10
        },

        y: function(y) {
            this.wrapper.y = y
            this.text.y = y + 10

            if(this.elementView)
                this.elementView.y = y + 10
        },

        width: function(width) {
            this.wrapper.width = width
        },

        height: function(height) {
            this.wrapper.height = height
        },

        value: function(value) {
            if(this.elementView)
                this.elementView.destroy()

            this.elementView = components[value](this.parentElement, {
                x: this.x + 100,
                y: this.y
            })
            this.text.value = this.elementView.name
        }
    },

    destroy: function() {
        if(this.elementView)
            this.elementView.destroy()
    }
})

var ElementsList = AnonimComponent({
    name: 'ElementsList',

    structure: [
        ['wrapper', Scroller, {
            width: 400,
            height: window.innerHeight - 50,
            y: 50,
            inner: List
        }]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 400],
        ['height', Number, 100],
        ['context']
    ],

    create: function() {
        this.updateLayout = function() {
            var y = 0
            this.wrapper.self.innerView.self.views.forEach(function(elementView) {
                elementView.x = 0
                elementView.y = y
                elementView.width = 400
                y += 100
            })
        }
    },

    init: function() {
        var self = this

        this.wrapper.innerHeight = 0
        this.wrapper.self.innerView.template = Element
        this.wrapper.self.innerView.itemInserted = function() {
            self.wrapper.innerHeight += 100//self.height
            self.updateLayout()
        }
        this.wrapper.self.innerView.itemDeleted = function() {
            self.wrapper.innerHeight -= 100//self.height
            self.updateLayout()
        }
        this.components = Object.keys(components)
        this.wrapper.self.innerView.items = this.components
        this.wrapper.self.innerView.itemChanged = function(value) {
            var componentIndex = self.context.components.findIndex(function(component) {
                return component.name == value.data
            })

            if(componentIndex == -1)
                return

            self.context.selectedElement = undefined
            self.context.name = self.context.components[componentIndex].name
            self.context.structure = self.context.components[componentIndex].structure.map(function(structureElement) {
                return {
                    name: structureElement.name,
                    properties: Object.keys(structureElement.properties)
                        .reduce(function(propertiesCopy, propertyName) {
                            propertiesCopy[propertyName] = structureElement.properties[propertyName]
                            return propertiesCopy
                        }, {})//{...structureElement.properties}
                }
            })
            self.context.updateContext()
        }
    },

    change: {
        x: function(x) {
            this.wrapper.x = x
            this.updateLayout()
        },

        y: function(y) {
            this.wrapper.y = y
            this.updateLayout()
        },

        width: function(width) {
            this.wrapper.width = width
            this.updateLayout()
        },

        height: function(height) {
            this.wrapper.height = height
            this.updateLayout()
        },

        context: function(context) {
            var self = this

            while(this.components.length)
                this.components.delete(0)

            Object.keys(components).forEach(function(componentName) {
                self.components.insert(componentName)
            })
        }
    },
})

var PreviewElement = AnonimComponent({
    name: 'PreviewElement',

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, 0],
        ['height', Number, 0],
        ['offsetX', Number, 0],
        ['offsetY', Number, 0],
        ['component', Component],
        ['properties'],
        ['context']
    ],

    create: function() {
        
    },

    init: function() {
        
    },

    change: {
        x: function(x) {
            if(this.view) {
                this.wrapper.x = x
                this.view.x = x
            }
        },

        y: function(y) {
            if(this.view) {
                this.wrapper.y = y
                this.view.y = y
            }
        },

        width: function(width) {
            if(this.view) {
                this.wrapper.width = width
            }
        },

        height: function(height) {
            if(this.view) {
                this.wrapper.height = height
            }
        },

        component: function(component) {
            if(this.view) {
                this.wrapper.destroy()
                this.view.destroy()
            }

            this.view = component(this.parentElement, this.properties)
            this.view.x = this.x
            this.view.y = this.y

            var self = this

            this.wrapper = Rectangle(this.parentElement, {
                color: 'none',
                cursor: 'pointer',
                x: this.x,
                y: this.y,
                width: this.view.width,
                height: this.view.height
            })

            this.wrapper.mouseover = function() {
                self.wrapper.outline = '1px solid #19a0fb' //#f35d3e
            }
            this.wrapper.mouseleave = function() {
                if(self != self.context.selectedElement)
                    self.wrapper.outline = 'none'
            }
            this.wrapper.mousedown = function(event) {
                event.stopPropagation()
                self.context.elementMouseDownEvent = event

                if(self.context.selectedElement) {
                    self.context.selectedElement.wrapper.outline = 'none'
                }

                self.context.selectedElement = self
                self.context.parameterEditor.view = self
                self.wrapper.outline = '1px solid #19a0fb'
            }
            this.wrapper.touchstart = function(event) {
                event.stopPropagation()
                self.context.elementMouseDownEvent = event

                if(self.context.selectedElement) {
                    self.context.selectedElement.wrapper.outline = 'none'
                }

                self.context.selectedElement = self
                self.context.parameterEditor.view = self
                self.wrapper.outline = '1px solid #19a0fb'
            }
            this.wrapper.mouseup = function(event) {
                self.context.elementMouseDownEvent = undefined
            }
            this.wrapper.touchend = function(event) {
                self.context.elementMouseDownEvent = undefined
            }
            this.wrapper.click = function(event) {
                event.stopPropagation()
            }
        },

        properties: function(properties) {
            
        }
    },

    destroy: function() {
        if(this.view) {
            this.view.destroy()
            this.wrapper.destroy()
        }
    }
})

var Preview = AnonimComponent({
    name: 'Preview',

    structure: [
        ['scroller', Scroller, {
            width: 400,
            height: window.innerHeight,
            inner: Rectangle
        }],
    ],

    inputs: [
        ['x', Number, 400],
        ['y', Number, 50],
        ['width', Number, window.innerHeight - 400 - 200],
        ['height', Number, window.innerHeight - 50],
        ['elements', Array, []],
        ['context']
    ],

    create: function() {
        var self = this

        this.updateLayout = function() {
            this.scroller.x = this.x
            this.scroller.y = this.y
            this.scroller.width = this.width
            this.scroller.height = this.height

            if(!this.wrapper) {
                this.wrapper = this.scroller.self.innerView

                this.wrapper.click = function() {
                    if(self.context.selectedElement) {
                        self.context.selectedElement.wrapper.outline = 'none'
                        self.context.selectedElement = undefined
                        self.context.parameterEditor.view = undefined
                    }
                }

                this.wrapper.dragover = this.wrapper.dragenter = function(event) {
                    event.returnValue = false
                    event.preventDefault()
                }

                this.wrapper.drop = function(event) {
                    var componentName = event.dataTransfer.getData('component')

                    var model = {
                        name: componentName,
                        properties: {
                            x: event.layerX,
                            y: event.layerY
                        }
                    }
                    self.context.structure.push(model)

                    var view = PreviewElement(self.wrapper.element, {
                        x: event.layerX,
                        y: event.layerY,
                        offsetX: self.x,
                        offsetY: self.y,
                        component: components[componentName],
                        properties: model.properties,
                        context: self.context
                    })
                    self.views.push(view)

                    model.properties.width = view.self.view.width
                    model.properties.height = view.self.view.height
                }
            }
            
            this.wrapper.x = 0
            this.wrapper.y = 0
            this.wrapper.width = this.width
            this.wrapper.height = this.height
            this.wrapper.color = '#e5e5e5'

            this.scroller.innerWidth = this.wrapper.width
            this.scroller.innerHeight = this.wrapper.height
        }

        this.views = []
    },

    init: function() {
        var self = this

        if(this.context) {
            this.context.structure.forEach(function(element) {
                var view = PreviewElement(self.wrapper.element, {
                    x: element.properties.x,
                    y: element.properties.y,
                    offsetX: self.x,
                    offsetY: self.y,
                    component: components[element.name],
                    properties: element.properties,
                    context: self.context
                })

                self.views.push(view)
            })
        }

        this.mouseUpSubscription = subscribe('onmouseup', function(event) {
            self.context.elementMouseDownEvent = undefined
        })

        this.mouseMoveSubscription = subscribe('onmousemove', function(event) {
            if(self.context.elementMouseDownEvent) {
                var eventX = event.x || event.clientX
                var eventY = event.y || event.clientY

                var newX = eventX - self.x - self.context.elementMouseDownEvent.layerX
                var newY = eventY - self.y - self.context.elementMouseDownEvent.layerY

                self.context.selectedElement.properties.x = newX
                self.context.selectedElement.outerNode.x = newX

                self.context.selectedElement.properties.y = newY
                self.context.selectedElement.outerNode.y = newY
            }
        })
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
        },

        context: function(context) {
            var self = this

            self.views.forEach(function(view) {
                view.destroy()
            })
            self.views = []

            context.structure.forEach(function(element) {
                var view = PreviewElement(self.wrapper.element, {
                    x: element.properties.x,
                    y: element.properties.y,
                    offsetX: self.x,
                    offsetY: self.y,
                    component: components[element.name],
                    properties: element.properties,
                    context: context
                })
                self.views.push(view)
            })

            this.updateLayout()
        }
    },

    destroy: function() {
        this.mouseUpSubscription.unsubscribe()
        this.mouseMoveSubscription.unsubscribe()
    }
})

var ParameterEditorElement = AnonimComponent({
    name: 'ParameterEditorElement',

    structure: [
        ['wrapper', Rectangle, {
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            color: '#fff'
        }],
        ['name', Text, {
            x: 0,
            y: 0,
            color: '#b3b3b3'
        }],
        ['inputValue', Input, {
            x: 0,
            y: 0
        }]
    ],

    inputs: [
        ['x', Number, 20],
        ['y', Number, 0],
        ['width', Number, 200],
        ['height', Number, 100],
        ['value']
    ],
    outputs: ['valueChanged'],

    create: function() {
        var self = this

        this.updateLayout = function() {
            this.wrapper.x = this.x
            this.wrapper.y = this.y
            this.wrapper.width = this.width
            this.wrapper.height = this.height

            this.name.y = this.y
            this.name.x = this.x

            this.inputValue.y = this.y + 24
            this.inputValue.x = this.x

            this.inputValue.valueChanged = function(inputValue) {
                var inputName = self.value.input[0]

                switch(self.value.input[1]) {
                    case Number:
                        self.value.properties[inputName] = parseInt(inputValue)
                        self.value.view.view[inputName] = parseInt(inputValue)
                        break

                    default:
                        self.value.properties[inputName] = inputValue
                        self.value.view.view[inputName] = inputValue
                }

                switch(inputName) {
                    case 'x': self.value.view.outerNode.x = parseInt(inputValue); break
                    case 'y': self.value.view.outerNode.y = parseInt(inputValue); break
                    case 'width': self.value.view.outerNode.width = parseInt(inputValue); break
                    case 'height': self.value.view.outerNode.height = parseInt(inputValue); break
                }
            }
        }
    },

    init: function() {
        var self = this

        //this.name.value = this.value.input[0]
        //this.inputValue.value = this.value.view.view[this.value.input[0]]
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
        },

        value: function(value) {
            this.name.value = value.input[0]
            this.inputValue.value = value.view.view[value.input[0]]
            this.updateLayout()
        }
    }
})

var ParameterEditor = AnonimComponent({
    name: 'ParameterEditor',

    structure: [
        ['wrapper', Scroller, {
            width: 240,
            y: 50,
            height: window.innerHeight - 50,
            inner: List
        }]
    ],

    inputs: [
        ['x', Number, 1000],
        ['y', Number, 0],
        ['width', Number, 240],
        ['height', Number, 480],
        ['view']
    ],

    create: function() {
        this.updateLayout = function() {
            this.wrapper.x = this.x
            this.wrapper.y = this.y
            this.wrapper.width = this.width
            this.wrapper.height = this.height

            var y = 20
            this.wrapper.self.innerView.self.views.forEach(function(elementView) {
                //elementView.x = 0//self.x
                elementView.y = y
                elementView.width = 200
                y += 80
            })
        }
    },

    init: function() {
        this.parameters = []

        var self = this

        this.wrapper.x = self.x

        this.wrapper.self.element.onkeydown = this.wrapper.self.element.onmousedown = function(event) {
            event.stopPropagation()
        }

        this.wrapper.innerHeight = 0
        this.wrapper.self.innerView.template = ParameterEditorElement
        this.wrapper.self.innerView.itemInserted = function() {
            self.wrapper.innerHeight += 80//self.height
            self.updateLayout()
        }
        this.wrapper.self.innerView.itemDeleted = function() {
            self.wrapper.innerHeight -= 80//self.height
            self.updateLayout()
        }
        this.wrapper.self.innerView.items = this.parameters
        this.updateLayout()
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
        },

        view: function(view) {
            var self = this

            while(this.parameters.length)
                this.parameters.delete(0)

            if(view) {
                view.view.inputs.forEach(function(input, inputIndex) {
                    self.parameters.insert({
                        input: input,
                        view: view,
                        properties: view.properties
                    })

                    view.view[input[0] + 'Changed'] = function(newValue) {
                        var inputData = self.parameters[inputIndex]
                        inputData.view.outerNode.width = newValue
                        inputData.properties.width = newValue
                        var widthParameterElement = self.wrapper.self.innerView.self.views[inputIndex]
                        widthParameterElement.value = inputData
                    }
                })
            }

            this.updateLayout()
        }
    },

    destroy: function() {
        while(this.parameters.length)
            this.parameters.delete(0)
    }
})

var Editor = AnonimComponent({
    name: 'Editor',

    structure: [
        ['controlPanel', ControlPanel],
        ['elementsList', ElementsList],
        ['preview', Preview],
        ['parameterEditor', ParameterEditor]
    ],

    inputs: [
        ['x', Number, 0],
        ['y', Number, 0],
        ['width', Number, window.innerWidth],
        ['height', Number, window.innerHeight]
    ],

    create: function() {
        this.updateLayout = function() {
            this.controlPanel.width = window.innerWidth
            this.controlPanel.height = 50
            this.controlPanel.x = 0
            this.controlPanel.y = 0

            this.elementsList.width = 400
            this.elementsList.height = window.innerHeight - 50
            this.elementsList.x = 0
            this.elementsList.y = 50

            this.preview.width = Math.max(window.innerWidth - 240 - 400, 200)
            this.preview.height = window.innerHeight - 50
            this.preview.x = 400
            this.preview.y = 50

            this.parameterEditor.width = 240
            this.parameterEditor.height = window.innerHeight - 50
            this.parameterEditor.x = 400 + Math.max(window.innerWidth - 240 - 400, 200)
            this.parameterEditor.y = 50
        }
    },

    init: function() {
        var self = this

        var storedComponents = localStorage.getItem('components')
        if(storedComponents)
            storedComponents = JSON.parse(storedComponents)
        else
            storedComponents = [
                /*{
                    name: 'Site',
                    structure: [
                        {
                            name: 'Rectangle',
                            properties: {
                                x: 0,
                                y: 0,
                                width: 100,
                                height: 100,
                                color: 'red'
                            }
                        }
                    ]
                }*/
            ]

        var context = {
            selectedElement: undefined,
            parameterEditor: self.parameterEditor,
            controlPanel: self.controlPanel,
            components: storedComponents,
            name: 'NewComponent',
            structure: [],

            build: function() {
                var code = build({name: context.name, structure: context.structure}, context.components)

                localStorage.setItem('components', JSON.stringify(context.components))

                //console.log(code)
                //console.log('data:text/html,' + encodeURI(code))
                var debugWindow = window.open(undefined, context.name, 'left=0,top=0,width=640,height=480')
                var script = debugWindow.document.createElement('script')
                script.innerHTML = code
                debugWindow.document.body.appendChild(script)
            },

            updateContext: function() {
                context.components.forEach(function(component) {
                    var structure = component.structure.map(function(structureElement) {
                        return [window[structureElement.name], structureElement.properties]
                    })

                    var componentWidth = 0
                    var componentHeight = 0

                    component.structure.forEach(function(structureElement) {
                        if(structureElement.properties.x + structureElement.properties.width > componentWidth)
                            componentWidth = structureElement.properties.x + structureElement.properties.width

                        if(structureElement.properties.y + structureElement.properties.height > componentHeight)
                            componentHeight = structureElement.properties.y + structureElement.properties.height
                    })

                    window[component.name] = Component({
                        name: component.name,
                        structure: structure,
                        inputs: [
                            ['x', Number, 0],
                            ['y', Number, 0],
                            ['width', Number, componentWidth],
                            ['height', Number, componentHeight],
                        ],
                        init: function() {
                            var self = this

                            this.updateLayout = function() {
                                self.outerNode.children.forEach(function(structureElement, index) {
                                    structureElement.x = self.x + component.structure[index].properties.x
                                    structureElement.y = self.y + component.structure[index].properties.y
                                })
                            }

                            this.updateLayout()
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
                    })
                })

                self.controlPanel.context = context
                self.elementsList.context = context
                self.preview.context = context
            }
        }
        context.updateContext()

        this.updateLayout()

        this.resizeSubscription = subscribe('onresize', function(event) {
            self.updateLayout()
        })

        this.mouseDownSubscription = subscribe('onmousedown', function() {
            if(context.selectedElement) {
                context.selectedElement.wrapper.outline = 'none'
            }

            context.selectedElement = undefined
            context.parameterEditor.view = undefined
        })

        this.keyDownSubscription = subscribe('onkeydown', function(event) {
            if(event.code == 'Delete') {
                if(context.selectedElement) {
                    var index = self.preview.self.views.indexOf(context.selectedElement.outerNode)
                    self.preview.self.views[index].destroy()
                    self.preview.self.views.splice(index, 1)
                    context.structure.splice(index, 1)
                    context.parameterEditor.view = undefined
                }
            }
        })
    },

    change: {
        x: function(x) {
            this.elementsList.x = x
        },

        y: function(y) {
            this.elementsList.y = y
        }
    },

    destroy: function() {
        this.resizeSubscription.unsubscribe()
        this.mouseDownSubscription.unsubscribe()
        this.keyDownSubscription.unsubscribe()
    }
})