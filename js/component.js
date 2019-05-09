function drawComponent(parentElement, properties) {
    var name = properties.name || 'no-name'
    var innerComponents = properties.structure
    var inputs = properties.inputs || []
    var outputs = properties.outputs || []
    var constructor = properties.create || function() {}
    var onInit = properties.init || function() {}
    var onDestroy = properties.destroy || function() {}
    var onChange = properties.change || {}

    var self = {name, parentElement}
    var children = []

    self.element = null
    self.children = children

    var outputListeners = outputs.map(() => undefined)

    var inputToIndexMap = {}

    inputs.reduce((map, name, index) => {
        self[name] = undefined
        map[name] = index
        return map
    }, inputToIndexMap)

    var outputToIndexMap = {}

    outputs.reduce((map, name, index) => {
        self[name] = function(data) {
            var listener = outputListeners[index]

            if(listener)
                listener(data)
        }

        map[name] = index
        return map
    }, outputToIndexMap)

    //TODO: __defineSetter__, __defineGetter__
    var proxy = new Proxy(self, {
        get: function(object, key) {
            if(key == 'children')
                return children

            if(key == 'destroy')
                return function() {
                    onDestroy.call(self)
                }

            if(key == 'parentElement')
                return parentElement

            if(key == 'element')
                return self.element

            if(key == 'structure')
                return innerComponents

            if(key == 'inputs')
                return inputs

            if(key == 'outputs')
                return outputs

            if(key == 'name')
                return name

            if(key == 'self')
                return self

            var inputIndex = inputToIndexMap[key]

            if(typeof inputIndex == 'number')
                return self[key]

            if(typeof outputToIndexMap[key] == 'number')
                return self[key]
        },

        set: function(object, key, value) {
            if(typeof inputToIndexMap[key] == 'number') {
                var oldValue = self[key]
                self[key] = value

                var changeListener = onChange[key]

                if(changeListener)
                    changeListener.call(self, value, oldValue)
                return
            }

            var outputIndex = outputToIndexMap[key]

            if(typeof outputIndex == 'number') {
                outputListeners[outputIndex] = value
                return
            }
        }
    })

    self.root = proxy
    constructor.call(self)

    if(innerComponents) {
        if(innerComponents === 'inner-content') {
            return
        }

        innerComponents.forEach(innerComponentDescription => {
            var referenceName
            var component
            var contentComponents

            referenceName = innerComponentDescription[0]

            if(typeof referenceName == 'string') {
                component = innerComponentDescription[1]
                contentComponents = innerComponentDescription[2]
            }
            else {
                component = innerComponentDescription[0]
                contentComponents = innerComponentDescription[1]
                referenceName = undefined
            }

            if(contentComponents === 'inner-content') {
                console.error(innerComponentDescription)
            }

            if(component) {
                var child = component(self.element || parentElement, contentComponents)
                children.push(child)

                if(referenceName)
                    innerComponentDescription[3] = child
            }
            else {
                var child = drawComponent(self.element || parentElement, {
                    name: 'inner-content',
                    structure: contentComponents
                })
                children.push(child)

                if(referenceName)
                    innerComponentDescription[3] = child
            }

            function updateNamespace(components) {
                components.forEach(componentDescription => {
                    var referenceName
                    var component
                    var contentComponents

                    referenceName = componentDescription[0]

                    if(typeof referenceName == 'string') {
                        component = componentDescription[1]
                        contentComponents = componentDescription[2]
                    }
                    else {
                        component = componentDescription[0]
                        contentComponents = componentDescription[1]
                        referenceName = undefined
                    }

                    if(referenceName) {
                        self[referenceName] = componentDescription[3]
                        //delete componentDescription[3]
                    }

                    if(contentComponents && contentComponents !== 'inner-content')
                        updateNamespace(contentComponents)
                })
            }

            updateNamespace(innerComponents)
        })
    }

    onInit.call(self)

    return proxy
}

function destroyComponentView(componentView) {
    componentView.children.forEach(child => destroyComponentView(child))
    componentView.destroy()
}

function AnonimComponent(properties) {
    var innerComponents = properties.structure
    var innerContentIndieces = []

    function getInnerContentIndex(nodes, innerContentPath) {
        nodes.forEach(function(node, index) {
            var isNamed = typeof node[0] == 'string'
            var innerContentShift = isNamed
                ? 2
                : 1

            innerContentPath.push(index, innerContentShift)

            if(node[innerContentShift] == 'inner-content')
                innerContentIndieces.push(innerContentPath.concat([]))
            else if(Array.isArray(node[innerContentShift]))
                getInnerContentIndex(node[innerContentShift], innerContentPath)

            innerContentPath.pop()
            innerContentPath.pop()
        })
    }

    if(innerComponents)
        getInnerContentIndex(innerComponents, [])

    return function(parentElement, contentComponents) {
        //if(contentComponents) {
            innerContentIndieces.forEach(function(index){
                var innerIndexNode = innerComponents

                for(var i = 0; i < index.length - 1; ++i)
                    innerIndexNode = innerIndexNode[index[i]]

                //console.log(properties.name + ':')
                //console.log('indices', JSON.stringify(innerContentIndieces))
                //console.log('before', JSON.stringify(innerIndexNode), index[index.length - 1], contentComponents)
                //console.log('structure', JSON.stringify(innerComponents))

                //innerIndexNode[4] = contentComponents
                innerIndexNode[index[index.length - 1]] = contentComponents

                //console.log('after', JSON.stringify(innerIndexNode), index[index.length - 1], contentComponents)
                //console.log('structure', JSON.stringify(innerComponents))
                //console.log('')
            })
        //}

        return drawComponent(parentElement, properties)
    }
}

var components = []

function Component(params) {
    var component = AnonimComponent(params)
    components.push(component)
    return component
}

///////////////////////////////////////////////////////////////////////////

/*
var Text = Component({
    name: 'text',

    inputs: ['value'],

    create: function() {
        this.element = document.createTextNode('')
        this.parentElement.appendChild(this.element)
    },

    change: {
        value: function(value) {
            this.element.data = value
        }
    },

    destroy: function(component) {
        this.parentElement.removeChild(this.element)
    }
})

var Rectangle = Component({
    name: 'rectangle',
    structure: [
        ['wrapper', null, 'inner-content']
    ],

    inputs: ['1'],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        //console.log(this.parentElement, this.children[0].element)

        //console.log(this.parentElement)
        this.element.style.display = 'block'
        this.element.style.padding = '10px'
        this.element.style.backgroundColor = 'red'
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Page = Component({
    structure: [
        [Rectangle, [
            ['text', Text]
        ]]
    ],

    init: function(component) {
        this.text.value = 'dsfds'
    }
})

Page(document.body)*/