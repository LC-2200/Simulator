var alert_open = false;
var logged_in = false;
var memory;

function on_load() {
    select("id","welcome").js_object.style.transform = "translateX(0%) translateY(-50%)";
    select("id","login_box").js_object.style.transform = "translateX(-50%) translateY(-50%)";
}

function instructor_scripts() {
    select("id","options_save").js_object.addEventListener("click", function() {
        alert("Options saved.");
    });
}

function student_scripts() {
    var editor = CodeMirror.fromTextArea(select("id","editor").js_object, {
        lineNumbers: true,
        width: 300,
        theme: "lesser-dark"
    });

    select("id","forward_microstate").js_object.addEventListener("click", function(e) {
        datapath_on_forward_microstate_click(e, editor);
    });

    select("id","back_microstate").js_object.addEventListener("click", function(e) {
        datapath_on_back_microstate_click(e, editor);
    });

    select("id","back_instruction").js_object.addEventListener("click", function(e) {
        datapath_on_back_click(e, editor);
    });

    select("id","forward_instruction").js_object.addEventListener("click", function(e) {
        datapath_on_forward_click(e, editor);
    });

    select("id","load").js_object.addEventListener("click", function(e) {
        datapath_on_load_click(e, editor);
    });

    memory = [];
    var memory_size = 65536;
    var memory_div = select("id", "memory").js_object;
    for (var i = 0; i < memory_size; i++) {
        memory[i] = document.createElement("div");
        memory[i].class = "memory_item";
        var location = document.createElement("span");
        location.class = "memory_item_location";
        location.innerHTML = ("0000" + i.toString(16)).substr(-4, 4) + ": ";
        var value = document.createElement("span");
        value.class = "memory_item_input";
        memory[i].value = value;
        memory[i].value.innerHTML = "0000 0000";
        memory[i].appendChild(location);
        memory[i].appendChild(value);
        memory_div.appendChild(memory[i]);
    }
}

function login() {
    var password = select("id","password_field").js_object.value;

    var client = new XMLHttpRequest();
    if (password == "a") {
        logged_in = true;
        client.open('GET', 'secure_content/student.html');
        client.onreadystatechange = function() {
            load_content(client.responseText);
        };
        client.send();
        setTimeout(student_scripts, 1000);
    } else if (password == "b") {
        logged_in = true;
        client.open('GET', 'secure_content/instructor.html');
        client.onreadystatechange = function() {
            load_content(client.responseText);
        };
        client.send();
        setTimeout(instructor_scripts, 1000);
    } else {
        alert("Invalid password.");
    }
}

select("id","button_login").js_object.addEventListener("click", function() {
    login();
});

select("id","alert_button").js_object.addEventListener("click", function() {
    close_alert();
});

document.addEventListener("keypress", function(e) {
    if (e.keyCode == 13 && !alert_open && !logged_in) {
        login();
    } else if (e.keyCode == 13 && alert_open) {
        close_alert();
    }
});

function load_content(content) {
    var container = select("id","content").js_object;
    container.setAttribute("class", "transparent");
    setTimeout(function() {
        container.innerHTML = content;
        container.setAttribute("class", "");
    }, 500);
}

document.onreadystatechange = function() {
    setTimeout(function() {
        on_load();
    }, 50);
};