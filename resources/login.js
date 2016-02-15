var alert_open = false;
var logged_in = false;
var memory_list;

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

     memory_list = new VirtualList({
        h: 400,
        itemHeight: 15,
        totalRows: 65536,
        generatorFn: function(row) {
            var elem = document.createElement("div");
            elem.innerHTML = ("0000" + row.toString(16)).toUpperCase().substr(-4, 4) + ": " + get_mem_value(row);
            elem.class = "memory_item";
            elem.style.position = "absolute";
            return elem;
        }
    });
    select("id", "memory").js_object.appendChild(memory_list.container);
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