var ListOfComponentElements = AnonimComponent({
    name: 'ListOfComponentElements',

    structure: [
        ['wrapper', Rectangle, [
            [Scroll, [
                ['list', List]
            ]]
        ]]
    ],

    inputs: ['components'],

    init: function() {
        this.wrapper.color = '#fff'

        this.list.template = AnonimComponent({
            name: 'item of component elements',

            structure: [
                ['elementWrapper', Rectangle, [
                    ['layout', Grid, [
                        ['preview', Rectangle],
                        ['name', Text]
                    ]]
                ]]
            ],

            inputs: ['value'],
            outputs: ['valueChange'],

            init: function() {
                this.layout.columns = '200px auto'
                this.name.style = 'italic'

                this.elementWrapper.element.draggable = true
                this.elementWrapper.element.ondragstart = event => {
                    this.value.context.dragedComponent = this.value.template
                    this.value.context.dragedComponentName = this.view.name
                    event.dataTransfer.setData('component', 0)
                }
            },

            change: {
                value: function(value) {
                    this.view = value.template(this.preview.element)
                    this.name.value = this.view.name
                }
            }
        })
    },

    change: {
        components: function(components) {
            this.list.items = components
        }
    }
})


var ComponentPropertiesEditor = AnonimComponent({
    name: 'ComponentPropertiesEditor',

    structure: [
        ['wrapper', Rectangle, [
            ['layout', Grid, [
                [Rectangle, [

                ]]
            ]],

            ['list', List]
        ]]
    ],

    inputs: ['node'],
    outputs: ['nodeChange'],

    init: function() {
        this.list.template = AnonimComponent({
            name: 'property editor',

            structure: [
                ['layout', Grid, [
                    ['name', Text],
                    ['valueEditor', Input]
                ]]
            ],

            inputs: ['value'],
            outputs: ['valueChange'],

            init: function() {
                this.valueEditor.valueChange = value => {
                    this.value.view[this.value.name] = JSON.parse(value)
                }
            },

            change: {
                value: function(property) {
                    this.name.value = property.name
                    this.valueEditor.value = property.value
                }
            }
        })
    },

    change: {
        node: function(node) {
            this.list.items = Object.keys(node.properties).map(propertyName => ({
                name: propertyName,
                value: node.properties[propertyName],
                view: node.view
            }))
        }
    }
})


var ComponentPreviewNode = AnonimComponent({
    name: 'ComponentPreviewNode',

    structure: [
        ['wrapper', Rectangle]
    ],

    inputs: ['value'],

    init: function() {
        this.wrapper.element.style.display = 'inline'

        this.wrapper.element.onmouseover = event => {
            this.wrapper.element.style.outline = '1px solid #000'
            event.stopPropagation()
        }

        this.wrapper.element.onmouseout = event => {
            this.wrapper.element.style.outline = '0px solid #000'
            event.stopPropagation()
        }

        this.wrapper.element.ondragenter = event => {
            event.returnValue = false
            event.preventDefault()
        }

        this.wrapper.element.ondragover = event => {
            event.returnValue = false
            event.preventDefault()
        }

        this.wrapper.element.ondrop = event => {
            event.stopPropagation()
            var elementType = event.dataTransfer.getData('component')

            if(!elementType)
                return

            var childNode = {
                parentNode: this.node,
                children: [],
                template: this.context.dragedComponent,
                templateName: this.context.dragedComponentName,
                view: undefined,
                properties: {}
            }

            this.node.children.insert({context: this.context, node: childNode})
        }

        this.wrapper.element.onclick = event => {
            event.stopPropagation()

            if(this.propertiesEditor) {
                destroyComponentView(this.propertiesEditor)
                this.propertiesEditor = undefined
            }
            else {
                this.propertiesEditor = ComponentPropertiesEditor(this.wrapper.element)
                this.propertiesEditor.node = this.node
            }
        }
    },

    change: {
        value: function({context, node, template}) {
            this.context = context

            if(node)
                this.node = node
            else
                this.node = context.structure

            if(!template)
                template = node.template

            if(!template) //inner-content
                return

            this.node.view = template(this.wrapper.element, [['__childrenList', List]])
            var list = this.node.view.self.__childrenList
            list.template = ComponentPreviewNode
            list.items = this.node.children

            this.node.properties = this.node.view.inputs.reduce((properties, name) => {
                properties[name] = JSON.stringify(this.node.view[name])
                return properties
            }, {})
        }
    },

    destroy: function() {
        if(this.node.view)
            destroyComponentView(this.node.view)
    }
})

var ComponentPreview = AnonimComponent({
    name: 'ComponentPreview',

    structure: [
        ['layout', ComponentPreviewNode]
    ],

    inputs: ['context'],
    outputs: [],

    change: {
        context: function(context) {
            this.context = context
            this.layout.value = {context, template: Rectangle}

            var previewLayout = this.layout.self.node.view
            previewLayout.width = '800px'
            previewLayout.height = '600px'
        }
    }
})


var ComponentViewEditor = AnonimComponent({
    name: 'ComponentViewEditor',

    structure: [
        ['layout', Grid, [
            ['elementsList', ListOfComponentElements],
            ['componentPreviewWrapper', Rectangle, [
                ['componentPreview', ComponentPreview]
            ]]
        ]]
    ],

    inputs: ['context'],

    init: function() {
        this.layout.columns = 'min-content auto'
        this.layout.gap = '20px'
        this.layout.element.style.fontSize = '0'

        this.componentPreviewWrapper.color = '#fff'
    },

    change: {
        context: function(context) {
            this.elementsList.components = context.components.map(template => ({context, template}))
            this.componentPreview.context = context
        }
    }
})


var ComponentStructureEditorNode = AnonimComponent({
    name: 'ComponentStructureEditorNode',

    structure: [
        ['wrapper', Rectangle, [
            ['layout', Grid, [
                [Rectangle, [
                    ['text', Text],
                    ['deleteButton', Button],
                    ['insertAfterPlace', Rectangle]
                ]],
                [Rectangle, [
                    ['insertBeforePlace', Rectangle],
                    ['children', List]
                ]]
            ]]
        ]]
    ],

    inputs: ['value'],

    init: function() {
        this.wrapper.width = '100%'

        this.wrapper.element.draggable = true
        this.wrapper.element.ondragstart = event => {
            event.stopPropagation()
            event.dataTransfer.setData('componentNode', 0)

            this.context.dragedComponentNode = this.value.node
        }

        this.layout.columns = 'min-content auto'
        this.layout.gap = '10px'
        this.text.value = 'Hi'
        this.deleteButton.text = 'delete'
        this.deleteButton.click = () => {
            var node = this.value.node

            var index
            for(index = 0; index < node.parentNode.children.length; ++index)
                if(node.parentNode.children[index].node === node)
                    break

            node.parentNode.children.delete(index)
        }
        this.children.template = ComponentStructureEditorNode

        this.insertBeforePlace.height = this.insertAfterPlace.height = '10px'
        this.insertBeforePlace.width = this.insertAfterPlace.width = '100%'
        this.insertBeforePlace.color = this.insertAfterPlace.color = '#678'

        this.insertBeforePlace.element.ondragenter = this.insertAfterPlace.element.ondragenter = event => {
            event.returnValue = false
            event.preventDefault()
        }

        this.insertBeforePlace.element.ondragover = this.insertAfterPlace.element.ondragover = event => {
            event.returnValue = false
            event.preventDefault()
        }

        this.insertAfterPlace.element.ondrop = event => {
            event.stopPropagation()
            var elementType = event.dataTransfer.getData('componentNode')

            if(!elementType)
                return

            var node = this.context.dragedComponentNode

            var index
            for(index = 0; index < node.parentNode.children.length; ++index)
                if(node.parentNode.children[index].node === node)
                    break

            var deletedValue = node.parentNode.children.delete(index)
            deletedValue.node.parentNode = this.value.node.parentNode
            var insertIndex = this.value.node.parentNode.children.indexOf(this.value) + 1
            this.value.node.parentNode.children.insert(deletedValue, insertIndex)
        }

        this.insertBeforePlace.element.ondrop = event => {
            event.stopPropagation()
            var elementType = event.dataTransfer.getData('componentNode')

            if(!elementType)
                return

            var node = this.context.dragedComponentNode

            var index
            for(index = 0; index < node.parentNode.children.length; ++index)
                if(node.parentNode.children[index].node === node)
                    break

            var deletedValue = node.parentNode.children.delete(index)
            deletedValue.node.parentNode = this.value.node
            this.value.node.children.insert(deletedValue, 0)
        }
    },

    change: {
        value: function(value) {
            this.context = value.context

            this.children.items = value.node.children
            this.text.value = value.node.templateName
        }
    }
})

var ComponentStructureEditor = AnonimComponent({
    name: 'ComponentStructureEditor',

    structure: [
        ['wrapper', Rectangle, [
            ['nodesWrapper', Rectangle, [
                ['list', List]
            ]],
            ['addInnerContentButton', Button]
        ]]
    ],

    inputs: ['context'],

    init: function() {
        this.nodesWrapper.width = '100%'
        this.list.template = ComponentStructureEditorNode

        this.addInnerContentButton.text = 'Add inner content'
    },

    change: {
        context: function(context) {
            this.list.items = context.structure.children

            this.addInnerContentButton.click = event => {
                context.structure.children.insert({
                    context,
                    node: {
                        template: undefined,
                        templateName: 'inner-content',
                        parentNode: context.structure,
                        children: []
                    }
                })
            }
        }
    }
})


var ComponentEditor = AnonimComponent({
    name: 'ComponentEditor',

    structure: [
        ['mainLayout', Grid, [
            ['mainTabPanel', TabPanel],
            ['structureEditor', ComponentStructureEditor]
        ]]
    ],

    inputs: ['value', 'message'],
    outputs: ['valueChange', 'content'],

    init: function() {
        this.context = {
            dragedComponent: undefined,
            dragedComponentName: undefined,
            components: [Grid, Rectangle2, Rectangle3],

            structure: {
                parentNode: undefined,
                children: []
            },

            dragedComponentNode: undefined,

            name: 'Component',
            inputs: [],
            outputs: [],
        }

        console.log(this.context)

        this.mainLayout.columns = 'auto 300px'
        this.mainLayout.gap = '20px'

        this.mainTabPanel.tabNames = ['View', 'Scripts']
        this.mainTabPanel.pages = [
            {template: ComponentViewEditor, context: this.context}
        ]

        this.structureEditor.context = this.context
    },

    change: {
        value: function(value) {

        },

        message: function(message) {
            switch(message) {
                case 'get content':
                        this.content(this.context)
                    break
            
                default:
                    console.warn(`Редактор компонентов не понимает сообщение ${message}`)
            }
        }
    }
})