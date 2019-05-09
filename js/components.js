var Text = Component({
    name: 'Text',
    
    inputs: ['value', 'style'],

    create: function() {
        this.element = document.createElement('span')
        this.element.style.whiteSpace = 'nowrap'
        this.element.style.fontSize = '14px'
        this.textNode = document.createTextNode('')
        this.element.appendChild(this.textNode)

        this.style = 'normal' //normal, italic, oblique
    },

    init: function() {
        this.parentElement.appendChild(this.element)
    },

    change: {
        value: function(value) {
            this.textNode.data = value
        },

        style: function(style) {
            this.element.style.fontStyle = style
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Button = Component({
    name: 'Button',

    structure: [
        ['textOnButton', Text]
    ],

    inputs: ['text'],
    outputs: ['click'],

    create: function() {
        this.element = document.createElement('button')
    },

    init: function() {
        this.text = this.textOnButton.value = 'Button'

        var self = this
        this.element.onclick = function() {
            self.click()
        }

        this.parentElement.appendChild(this.element)
    },

    change: {
        text: function(text) {
            this.textOnButton.value = text
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Input = Component({
    name: 'Input',
    
    inputs: ['value'],
    outputs: ['valueChange'],

    create: function() {
        this.element = document.createElement('input')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        var self = this
        this.element.oninput = function(event) {
            self.valueChange(self.element.value)
        }
    },

    change: {
        value: function(value) {
            this.element.value = value
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Dropdown = Component({
    name: 'Dropdown',

    inputs: ['items', 'selectedItemIndex'],
    outputs: ['selectedItemIndexChanged'],

    create: function() {
        this.element = document.createElement('select')
    },

    init: function() {
        this.element.oninput = function(event) {
            var selectedIndex = event.target.selectedIndex
            this.selectedItemIndexChanged(selectedIndex)
        }
    },

    change: {
        items: function(items) {
            this.element.innerHTML = ''

            items.forEach(function(item) {
                var optionElement = document.createElement('option')
                optionElement.innerHTML = item
                this.element.appendChild(optionElement)
            })
        },

        selectedItemIndex: function(selectedItemIndex) {
            this.element.selectedIndex = selectedItemIndex
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var NameEditor = Component({
    name: 'NameEditor',

    inputs: ['value'],
    outputs: ['valueChange'],

    create: function() {
        this.element = document.createElement('input')
    },

    init: function() {
        var inputElement = this.element
        var style = inputElement.style

        style.pointer         = 'text'
        style.backgroundColor = 'transparent'
        style.border          = 'none'
        style.padding         = 0
        style.margin          = 0
        style.outline         = 'none'
        style.width           = '20px'
        style.height          = '20px'

        inputElement.oninput = function() {
            style.width = Math.max(20, getTextWidth(inputElement.value)) + 'px'
            this.valueChange(inputElement.value)
        }

        inputElement.onclick = function(event) {
            event.stopPropagation()
        }
    },

    change: {
        value: function(value) {
            var inputElement = this.element
            var style = inputElement.style
            style.width = Math.max(20, getTextWidth(value)) + 'px'
            inputElement.value = value
        }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Grid = Component({
    name: 'Grid',

    structure: [
        [null, 'inner-content']
    ],

    inputs: ['rows', 'columns', 'gap'],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        with(this.element.style) {
            display = 'grid'
            height = '100%'
        }
    },

    change: {
        rows:    function(rows)    { this.element.style.gridTemplateRows = rows },
        columns: function(columns) { this.element.style.gridTemplateColumns = columns },
        gap:     function(gap)     { this.element.style.gap = gap }
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Scroll = Component({
    name: 'Scroll',

    structure: [
        [null, 'inner-content']
    ],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        var style = this.element.style

        style.display = 'block'
        style.overflow = 'auto'
        style.height = '100%'
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Rectangle = Component({
    name: 'Rectangle',

    structure: [
        [null, 'inner-content']
    ],

    inputs: ['width', 'minWidth', 'height', 'minHeight', 'margin', 'padding', 'color'],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        this.element.style.display = 'inline-block'
    },

    change: {
        width:     function(width)     {this.element.style.width = width},
        minWidth:  function(minWidth)  {this.element.style.minWidth = minWidth},
        maxWidth:  function(maxWidth)  {this.element.style.maxWidth = maxWidth},
        height:    function(height)    {this.element.style.height = height},
        minHeight: function(minHeight) {this.element.style.minHeight = minHeight},
        margin:    function(margin)    {this.element.style.margin = margin},
        padding:   function(padding)   {this.element.style.padding = padding},
        color:     function(color)     {this.element.style.backgroundColor = color}
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Rectangle2 = Component({
    name: 'Rectangle2',

    structure: [
        [null, 'inner-content']
    ],

    inputs: ['width', 'height', 'margin', 'padding', 'color'],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        this.element.style.display = 'inline-block'
        this.element.style.width = '100px'
        this.element.style.height = '100px'
        this.element.style.backgroundColor = 'red'
    },

    change: {
        width:   function(width)   {this.element.style.width = width},
        height:  function(height)  {this.element.style.height = height},
        margin:  function(margin)  {this.element.style.margin = margin},
        padding: function(padding) {this.element.style.padding = padding},
        color:   function(color)   {this.element.style.backgroundColor = color}
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var Rectangle3 = Component({
    name: 'Rectangle3',

    structure: [
        [null, 'inner-content']
    ],

    inputs: ['width', 'height', 'margin', 'padding', 'color'],

    create: function() {
        this.element = document.createElement('div')
        this.parentElement.appendChild(this.element)
    },

    init: function() {
        this.element.style.display = 'inline-block'
        this.element.style.width = '100px'
        this.element.style.height = '350px'
        this.element.style.backgroundColor = '#123'
    },

    change: {
        width:   function(width)   {this.element.style.width = width},
        height:  function(height)  {this.element.style.height = height},
        margin:  function(margin)  {this.element.style.margin = margin},
        padding: function(padding) {this.element.style.padding = padding},
        color:   function(color)   {this.element.style.backgroundColor = color}
    },

    destroy: function() {
        this.parentElement.removeChild(this.element)
    }
})

var List = Component({
    name: 'List',

    inputs: ['template', 'items'],
    outputs: ['itemChange'],

    create: function() {
        this.views = []
    },

    change: {
        items: function(items, previouseItems) {
            var self = this

            if(previouseItems)
                previouseItems['subscriptions'].splice(previouseItems['subscriptions'].indexOf(this), 1)

            this.views.forEach(view => destroyComponentView(view))
            this.views.splice(0, this.views.length)

            this.items.forEach((item, index) => {
                var component = this.template(this.parentElement)
                component.value = item

                component.valueChange = function(data) {
                    self.itemChange({data, index})
                }

                this.views[index] = component
            })

            if(!items['subscriptions']) {
                items['subscriptions'] = [this]
            }
            else {
                items['subscriptions'].push(this)
            }

            if(!items['delete']) {
                items['delete'] = function(index) {
                    this.subscriptions.forEach(subscription => {
                        destroyComponentView(subscription.views[index])
                        subscription.views.splice(index, 1)
                    })

                    return this.splice(index, 1)[0]
                }
            }

            if(!items['insert']) {
                items['insert'] = function(value, index) {
                    if(typeof index == 'undefined') {
                        this.subscriptions.forEach(subscription => {
                            var component = subscription.template(subscription.parentElement)
                            component.value = value

                            component.valueChange = function(data) {
                                subscription.itemChange({data, index: subscription.views.length})
                            }

                            subscription.views.push(component)
                        })

                        this.push(value)
                    }
                    else {
                        this.splice(index, 0, value)

                        this.subscriptions.forEach(subscription => {
                            subscription.views.forEach(view => destroyComponentView(view))
                            subscription.views = []
                        })

                        this.forEach(value => {
                            this.subscriptions.forEach(subscription => {
                                var component = subscription.template(subscription.parentElement)
                                component.value = value

                                component.valueChange = function(data) {
                                    subscription.itemChange({data, index})
                                }

                                subscription.views.push(component)
                            })
                        })
                    }
                }
            }
        }
    },

    destroy: function() {
        if(this.items)
            this.items['subscriptions'].splice(this.items['subscriptions'].indexOf(this), 1)

        this.views.forEach(view => destroyComponentView(view))
    }
})

/*
window.onload = () => {
    var l = List(document.body)
    l.template = Text
    l.items = ['Alexey', 'Oknesirob']
    console.log(l.items.delete(1))
    l.items.insert('Hi', 1)
    console.log(l.items)
}
*/

var TabPanel = Component({
    name: 'TabPanel',

    structure: [
        ['wrapper', Grid, [
            ['page', Rectangle],
            ['head', Grid, [
                ['headList', List]
            ]]
        ]]
    ],

    inputs: ['tabNames', 'pages', 'defaultTabIndex', 'tabChanged'],
    //outputs: ['tabChanged'],

    init: function() {
        var tabPanel = this
        this.wrapper.rows = 'auto min-content'

        this.headList.template = AnonimComponent({
            name: 'tab-panel-head',

            structure: [
                [Rectangle, [
                    ['navigationButton', Button]
                ]]
            ],

            inputs: ['value'],
            outputs: ['valueChange'],

            change: {
                value: function(value) {
                    this.navigationButton.text = value

                    this.navigationButton.click = () => {
                        this.valueChange(value)
                    }
                }
            }
        })

        this.headList.itemChange = function(selectedTab) {
            if(tabPanel.selectedTab)
                destroyComponentView(tabPanel.selectedTab)

            tabPanel.selectedTab = tabPanel.pages[selectedTab.index](tabPanel.page.element)
            
            if(tabPanel.tabChanged) {
                var tabChangedHandler = tabPanel.tabChanged[selectedTab.data]

                if(tabChangedHandler)
                    tabChangedHandler(tabPanel.selectedTab)

                //tabPanel.tabChanged({tab: tabPanel.selectedTab, name: selectedTab.data})
            }
        }
    },

    change: {
        tabNames: function(tabNames) {
            this.head.columns = 'min-content '.repeat(tabNames.length)
            this.headList.items = tabNames
        },

        pages: function(pages) {
            //this.pages = pages

            var tabIndex = 0

            if(this.defaultTabIndex)
                tabIndex = this.defaultTabIndex

            if(this.selectedTab)
                destroyComponentView(this.selectedTab)

            this.selectedTab = pages[tabIndex].template(this.page.element)
            this.selectedTab.context = pages[tabIndex].context
        }
    }
})
/*
var page1 = AnonimComponent(
    'page1',
    [
        ['text', TextComponent]
    ],

    [], [],

    function() {

    },

    function() {
        this.text.value = 'Page 1'
    },

    function(name, value) {

    },

    function() {

    }
)

var page2 = AnonimComponent(
    'page2',
    [
        ['text', TextComponent],
        [ButtonComponent]
    ],

    [], [],

    function() {

    },

    function() {
        this.text.value = 'Page 2'
    },

    function(name, value) {

    },

    function() {

    }
)

var tab = TabPanel(document.body)
tab.pages = [page1, page2]
tab.tabNames = ['Tab1', 'Tab2']
*/