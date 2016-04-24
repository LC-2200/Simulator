/**
 * Calling this function creates an alert window.
 *
 * @param message main content of alert
 * @param title header of alert
 * @param button text for alert button
 * @param cancel boolean to show or hide cancel button
 * @param button_callback function to run when button is pressed
 * @param cancel_callback function to run when cancel is pressed
 * @param cancel_button_text alternative text for cancel button
 */
function alert(message, title, button, cancel, button_callback, cancel_callback, cancel_button_text) {
    message = (message == null) ? "" : message;
    title = (title == null) ? "" : title;
    button = (button == null) ? "ok" : button;
    button_callback = (button_callback == null) ? function() {close_alert()} : button_callback;
    cancel_callback = (cancel_callback == null) ? function() {close_alert()} : cancel_callback;
    cancel = (cancel == null) ? false : cancel;
    cancel_button_text = (cancel_button_text == null) ? "cancel" : cancel_button_text;

    document.activeElement.blur();

    select("id", "alert_message").js_object.innerHTML = message;
    select("id", "alert_title").js_object.innerHTML = title;
    select("id", "alert_button").js_object.innerHTML = button;
    select("id", "alert_cancel").js_object.innerHTML = cancel_button_text;
    if (cancel) {
        select("id", "alert_cancel").remove_class("display_none");
    } else {
        select("id", "alert_cancel").add_class("display_none");
    }

    select("id", "alert_container").remove_class("display_none");
    setTimeout(function() {
        select("id", "alert_container").remove_class("transparent");
    }, 10);

    select("id", "alert_button").js_object.onclick = button_callback;
    select("id", "alert_cancel").js_object.onclick = cancel_callback;

    select("id", "content").add_class("blurred");
}

/**
 * Closes the current alert window. Should usually be called at the end of a button callback in alert()
 */
function close_alert() {
    select("id", "alert_container").add_class("transparent");
    setTimeout(function() {
        select("id", "alert_container").add_class("display_none");
    }, 500);

    select("id", "content").remove_class("blurred");
}

/**
 * Selects a dom element and adds some functionality to the returned result
 * such as add_class and remove_class. Selecting a class will return an
 * array of DOM_objects while an ID will return a single object.
 *
 * @param method can either be "id" or "class"
 * @param selector the class or id name
 * @returns either an array of DOM_objects or a single DOM_object
 */
function select(method, selector) {
    if (method == "id") {
        var js_object = document.getElementById(selector);
        return js_object == undefined ? undefined : DOM_Object(js_object);
    }

    if (method == "class") {
        var elements = [];
        var js_objects = document.getElementsByClassName(selector);

        for (var i = 0; i < js_objects.length; i++) {
            elements.push(new DOM_Object(js_objects[i]));
        }

        return elements;
    }
}

/**
 * Wrapper for a dom object to abstract out common functionality
 *
 * @param js_object any default javascript representation of a dom object
 * @constructor
 */
function DOM_Object(js_object) {
    this.js_object = js_object;
    if (this.className != undefined) {
        this.classes = this.js_object.className == undefined ? [] : this.js_object.className.split(" ");
    } else {
        this.classes = [];
    }

    //add a class to a dom object
    this.add_class = function (class_name) {
        if (this.classes.indexOf(class_name) == -1) {
            this.classes.push(class_name);
        }
        this.js_object.className = this.classes.join(" ");
    };

    // remove a class from a selected dom object
    this.remove_class = function(class_name) {
        if (this.classes.indexOf(class_name) != -1) {
            this.classes.splice(this.classes.indexOf(class_name), 1);
        }
        this.js_object.className = this.classes.join(" ");
    };
    return this;
}

/**
 * Sends an HTTP GET request
 *
 * @param url endpoint of request
 * @param data a dictionary of values to send as the get vars
 * @param json_parse boolean value for whether the result should be parsed as json
 * @param callback function to call with the response as a var
 */
function get(url, data, json_parse, callback) {
    if (json_parse == undefined) json_parse = true;
    if (callback == undefined) callback = function(result) {};

    var param_string =  "?";
    var prefix = "";
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            param_string += prefix + property + "=" + encodeURIComponent(data[property]);
        }
        prefix = "&";
    }

    var request = new XMLHttpRequest();
    request.open("GET", url + param_string, true);
    request.onloadend = function() {
        if (json_parse) {
            var result;
            try {
                result = JSON.parse(request.responseText);
            } catch (ex) {
                result = {"error": request.responseText};
            }
            callback(result);
        } else {
            callback(request.responseText);
        }
    };
    request.send();
}

/**
 * Sends an HTTP POST request.
 *
 * @param url endpoint of request
 * @param data a dictionary of values to send as the post vars
 * @param json_parse boolean value for whether the result should be parsed as json
 * @param callback function to call with the response as a var
 */
function post(url, data, json_parse, callback) {
    if (json_parse == undefined) json_parse = true;
    if (callback == undefined) callback = function(result) {};

    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.onloadend = function() {
        if (json_parse) {
            var result;
            try {
                result = JSON.parse(request.responseText);
            } catch (ex) {
                result = {"error": request.responseText};
            }
            callback(result);
        } else {
            callback(request.responseText);
        }
    };
    request.send(JSON.stringify(data));
}

