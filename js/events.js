var subscriptions = {
    'onmouseup': [],
    'onmousedown': [],
    'onmousemove': [],
    'onmouseleave': [],
    'onresize': [],
    'onkeydown': [],
    'ontouchstart': [],
    'ontouchmove': []
}

Object.keys(subscriptions).forEach(function(eventName){
    window[eventName] = function(event) {
        subscriptions[eventName].forEach(function(subscription){
            subscription.handler(event)
        })
    }
})

function subscribe(eventName, handler){
    var subscription = {
        handler: handler,
        
        unsubscribe: function() {
            var index = subscriptions[eventName].findIndex(function(currentSubscription){return currentSubscription == subscription})
        }
    }

    subscriptions[eventName].push(subscription)

    return subscription
}