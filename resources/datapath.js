var datapath = {
    set_value: function(property, value) {
        datapath[property] = value;
        update_datapath_ui();
    },
    bus: "hi",
    registers: {
        1: undefined,
        2: undefined
    }
};

function datapath_on_forward_microstate_click(e, editor) {
    // todo
    datapath.set_value("bus", "hellooooo");
}

function datapath_on_back_microstate_click(e, editor) {
    // todo
}

function datapath_on_back_click(e, editor) {
    // todo
}

function datapath_on_forward_click(e, editor) {
    // todo
}

function datapath_on_load_click(e, editor) {
    // todo
}

function update_datapath_ui() {
    // todo
    select("id", "datapath_bus_value").js_object.innerHTML = datapath.bus;
}