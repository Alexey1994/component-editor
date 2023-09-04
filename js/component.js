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
}