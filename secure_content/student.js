var datapath = {
    state: 0,
    regno: 0,
    func: 0,
    bus: 0x00000000,
    IR: 0x00000000,
    MAR: 0x00000000,
    A: 0x00000000,
    B: 0x00000000,
    PC: 0x00000000,
    Z: 0,
    registers: Array.apply(null, new Array(16)).map(Number.prototype.valueOf,0),
    mem: Array.apply(null, new Array(65536)).map(Number.prototype.valueOf,0)
};
var editor;
var program_loaded = false;
var stack = [];
var MICROCODE;

const LOOKUP = {
    name: 0,
    nextState: 1,
    drAlu: 2,
    drMem: 3,
    drOff: 4,
    drPc: 5,
    drReg: 6,
    ldA: 7,
    ldB: 8,
    ldIr: 9,
    ldMar: 10,
    ldPc: 11,
    ldZ: 12,
    wrReg: 13,
    wrMem: 14,
    regSel: 15,
    func: 16,
    opTest: 17,
    chkZ: 18
};

const OP_TABLE = [3,6,9,12,16,20,27,29];
const Z_TABLE = [0,24];

var current_state = MICROCODE[0];

function reset_datapath() {
    current_state = MICROCODE[0];
    datapath.bus = null;
    datapath.A = 0;
    datapath.B = 0;
    datapath.func = 0;
    datapath.IR = 0;
    datapath.MAR = 0;
    for (var i = 0; i < datapath.mem.length; i++) {
        datapath.mem[i] = 0;
    }
    datapath.PC = 0;
    for (i = 0; i < datapath.registers.length; i++) {
        datapath.registers[i] = 0;
    }
    datapath.regno = 0;
    datapath.state = 0;
    datapath.Z = 0;
    stack = [];
}


// FIX ME!
function next_state() {
    return current_state[LOOKUP.opTest] == 1 ? OP_TABLE[datapath.IR >>> 28]
        : current_state[LOOKUP.chkZ] == 1 ? Z_TABLE[datapath.Z]
        : MICROCODE[datapath.state][1];
}

function update_selectors() {
    datapath.func = current_state[LOOKUP.func];
    if (current_state[LOOKUP.regSel] == 0) {
        datapath.regno = datapath.IR << 4 >>> 28; // Rx is bits 27 - 24.
    } else if (current_state[LOOKUP.regSel] == 1) {
        datapath.regno = datapath.IR << 8 >>> 28; // Ry is bits 23 - 20.
    } else {
        datapath.regno = datapath.IR & 0xF; // Rz is bits 3 - 0.
    }
}

function update_bus() {
    if (current_state[LOOKUP.drAlu] == 1) {
        if (current_state[LOOKUP.func] == 0) {
            datapath.bus = ((datapath.A | 0) + (datapath.B | 0));
        } else if (current_state[LOOKUP.func] == 1) {
            datapath.bus = ~(datapath.A & datapath.B);
        } else if (current_state[LOOKUP.func] == 2) {
            datapath.bus = ((datapath.A | 0) - (datapath.B | 0));
        } else {
            datapath.bus = ((datapath.A | 0) + 1);
        }
    } else if (current_state[LOOKUP.drMem] == 1) {
        datapath.bus = datapath.mem[datapath.MAR & 0xFFFF];
    } else if (current_state[LOOKUP.drOff] == 1) {
        datapath.bus = datapath.IR << 12 >> 12; // Offset is bottom 20 bits.
    } else if (current_state[LOOKUP.drPc] == 1) {
        datapath.bus = datapath.PC;
    } else if (current_state[LOOKUP.drReg] == 1) {
        datapath.bus = datapath.registers[datapath.regno];
    } else {
        datapath.bus = null;
    }
}

function update_state_registers() {
    if (current_state[LOOKUP.ldA] == 1) {
        datapath.A = datapath.bus;
    }
    if (current_state[LOOKUP.ldB] == 1) {
        datapath.B = datapath.bus;
    }
    if (current_state[LOOKUP.ldIr] == 1) {
        datapath.IR = datapath.bus;
    }
    if (current_state[LOOKUP.ldMar] == 1) {
        datapath.MAR = datapath.bus;
    }
    if (current_state[LOOKUP.ldPc] == 1) {
        datapath.PC = datapath.bus;
    }
    if (current_state[LOOKUP.ldZ] == 1) {
        datapath.Z = datapath.bus == 0 ? 1 : 0;
    }
}

function update_register_file() {
    if ((current_state[LOOKUP.wrReg] == 1) && (datapath.regno != 0)) {
        // Save old register value to current saved state before we update.
        stack[0].reg_changed = datapath.regno;
        stack[0].reg_old_value = datapath.registers[datapath.regno];

        datapath.registers[datapath.regno] = datapath.bus;
    }
}

function update_memory() {
    if (current_state[LOOKUP.wrMem] == 1) {
        // Save old value to current saved state before we update.
        stack[0].mem_changed = (datapath.MAR & 0xFFFF);
        stack[0].mem_old_value = datapath.mem[datapath.MAR & 0xFFFF];

        datapath.mem[datapath.MAR & 0xFFFF] = datapath.bus;
        update_mem_view(datapath.MAR & 0xFFFF);
    }
}

function update_state() {
    datapath.state = next_state();
    current_state = MICROCODE[datapath.state];

    // Update func and regno
    update_selectors();

    // Pull any values onto the bus
    update_bus();

    // Load any registers
    update_state_registers();

    // Write to registers
    update_register_file();

    // Write to memory
    update_memory();
}

function save_state_to_stack() {
    var curr = {};
    curr.state = datapath.state;
    curr.regno = datapath.regno;
    curr.func = datapath.func;
    curr.bus = datapath.bus;
    curr.IR = datapath.IR;
    curr.MAR = datapath.MAR;
    curr.A = datapath.A;
    curr.B = datapath.B;
    curr.PC = datapath.PC;
    curr.Z = datapath.Z;
    curr.reg_changed = -1;
    curr.reg_old_value = 0;
    curr.mem_changed = -1;
    curr.mem_old_value = 0;

    stack.push(curr);
}

function load_state_from_stack() {
    if(stack.length > 0) {
        var curr = stack.pop();
        datapath.state = curr.state;
        datapath.regno = curr.regno;
        datapath.func = curr.func;
        datapath.bus = curr.bus;
        datapath.IR = curr.IR;
        datapath.MAR = curr.MAR;
        datapath.A = curr.A;
        datapath.B = curr.B;
        datapath.PC = curr.PC;
        datapath.Z = curr.Z;
        if(curr.reg_changed >= 0) {
            datapath.registers[curr.reg_changed] = curr.reg_old_value;
        }
        if(curr.mem_changed >= 0) {
            datapath.mem[curr.mem_changed] = curr.mem_old_value;
            update_mem_view(curr.mem_changed);
        }
        current_state = MICROCODE[datapath.state];
    }
}

const step_time_millis = 100;

function datapath_on_forward_microstate_click(e, editor) {
    if (!program_loaded) {
        alert("A program must be loaded first!", "Oops");
        return;
    }
    if (!disable_stepping) {
        save_state_to_stack();
        update_state();
        update_datapath_ui();
    }
}

function datapath_on_back_microstate_click(e, editor) {
    if (!program_loaded) {
        alert("A program must be loaded first!", "Oops");
        return;
    }
    if (!disable_stepping) {
        load_state_from_stack();
        update_datapath_ui();
    }
}

function datapath_on_back_click(e, editor) {
    if (!program_loaded) {
        alert("A program must be loaded first!", "Oops");
        return;
    }
    if (!disable_stepping) {
        disable_stepping = true;
        load_state_from_stack();
        update_datapath_ui();
        setTimeout(datapath_on_back_click_timeout, step_time_millis);
    }
}

function datapath_on_back_click_timeout(e, editor) {
    if (datapath.state != 0) {
        load_state_from_stack();
        update_datapath_ui();
        setTimeout(datapath_on_back_click_timeout, step_time_millis);
    } else {
        disable_stepping = false;
    }
}

var disable_stepping = false;

function datapath_on_forward_click(e, editor) {
    if (!program_loaded) {
        alert("A program must be loaded first!", "Oops");
        return;
    }
    if (!disable_stepping) {
        disable_stepping = true;
        save_state_to_stack();
        update_state();
        update_datapath_ui();
        setTimeout(datapath_on_forward_click_timeout, step_time_millis);
    }
}

function datapath_on_forward_click_timeout(e, editor) {
    if (datapath.state != 0) {
        save_state_to_stack();
        update_state();
        update_datapath_ui();
        setTimeout(datapath_on_forward_click_timeout, step_time_millis);
    } else {
        disable_stepping = false;
    }
}

function datapath_on_load_click(e, editor) {
    var input_contents = document.createElement("textarea");
    input_contents.id = "datapath_on_load_click_input";
    alert(input_contents.outerHTML, "Enter memory contents", "load", true, function() {
        var input = select("id", "datapath_on_load_click_input").js_object.value.toUpperCase();
        set_memory_s_file(0, input);
        update_datapath_ui();
        updateInstructionView(input);
    });
}


function update_datapath_ui() {
    set_datapath_element("bus", !(datapath.bus === null));
    var datapath_elements = ["drAlu", "drMem", "drOff", "drPc", "drReg", "ldA",
        "ldB", "ldIr", "ldMar", "ldPc", "ldZ", "wrReg", "wrMem"];
    for (var i = 0; i < datapath_elements.length; i++) {
        set_datapath_element(datapath_elements[i], current_state[LOOKUP[datapath_elements[i]]] == 1);
    }

    for (i = 0; i < 16; i++) {
        select("id", "datapath_register_" + i + "_value").js_object.textContent = to_hex(datapath.registers[i]);
    }


    select("id", "current_state_value").js_object.textContent = current_state[LOOKUP.name];

    for (i = 0; i < tooltips.length; i++) {
        tooltips[i].update_value();
    }
}

function get_mem_value(addr) {
    return to_hex(datapath.mem[addr]);
}

function set_datapath_element(elem, activate) {
    set_datapath_element_color(elem, activate ? '#00A63D' : 'rgb(255,255,255)');
}

function set_datapath_element_color(elem, color) {
    var datapath_svg = document.getElementById("datapath_svg");
    var element = datapath_svg.getElementById(elem);
    element.setAttribute("stroke", color);
    element.setAttribute("fill", color);
}

function to_hex(val) {
    if (val == null) {
        return "0xXXXXXXXX";
    } else {
        if (val < 0) {
            val = 0x100000000 + val;
        }
        return "0x" + ("00000000" + val.toString(16)).toUpperCase().substr(-8, 8);
    }
}

function update_mem_view(index) {
    memory_list.container.scrollTop = (memory_list.container.scrollHeight / datapath.mem.length) * (index - 5);
    memory_list._renderChunk(memory_list.container, (index - 15) < 0 ? 0 : index - 15);
}

function set_memory_s_file(start, text) {
    var split = text.split(" ");
    var nums = [];
    for (var i = 0; i < split.length; i++) {
        nums[i] = parseInt(split[i], 16);
    }
    set_memory(start, nums);
}

function set_memory(start, values) {
    reset_datapath();
    for(var i = 0; i < values.length; i++) {
        datapath.mem[start + i] = values[i];
    }
    program_loaded = true;
    update_mem_view(start);
}

function on_student_load() {
    editor = CodeMirror.fromTextArea(select("id","editor").js_object, {
        lineNumbers: true,
        readOnly: true,
        width: 300,
        theme: "lesser-dark",
        lineWrapping: true,
        lineNumberFormatter: function(n) {
            return n-1;
        }
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

    select("id", "regno").js_object.addEventListener("click", function(e) {
        new Tooltip("regno", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "func").js_object.addEventListener("click", function(e) {
        new Tooltip("func", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "bus").js_object.addEventListener("click", function(e) {
        new Tooltip("bus", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "ir").js_object.addEventListener("click", function(e) {
        new Tooltip("IR", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "mar").js_object.addEventListener("click", function(e) {
        new Tooltip("MAR", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "a").js_object.addEventListener("click", function(e) {
        new Tooltip("A", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "b").js_object.addEventListener("click", function(e) {
        new Tooltip("B", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "pc").js_object.addEventListener("click", function(e) {
        new Tooltip("PC", e.pageX, e.pageY);
        e.stopPropagation();
    });

    select("id", "z").js_object.addEventListener("click", function(e) {
        new Tooltip("Z", e.pageX, e.pageY);
        e.stopPropagation();
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

    var memory_search_timer;
    select("id", "memory_search").js_object.addEventListener("keyup", function(e) {
        if (memory_search_timer != undefined) {
            clearTimeout(memory_search_timer);
        }

        if (e.target.value == "0x") {
            e.target.value = "";
        } else if (e.target.value.substr(0, 2) != "0x") {
            e.target.value = "0x" + e.target.value;
        }

        memory_search_timer = setTimeout(function() {
            goto_vlist_line(parseInt(e.target.value));
        }, 500);
    });
}

function updateInstructionView(hexStrs) {
    var hexStrSplit = hexStrs.split(" ");
    var i;
    for (i = 0; i < hexStrSplit.length; i++){
        editor.replaceRange(getInstruction(hexStrSplit[i])+"\n", CodeMirror.Pos(editor.lastLine()));
    }
}

function getInstruction(hexStr){

    hexStr = hexStr.trim();
    var opcode = hexStr.charAt(0);

    /*if(hexStr.length != 8) {
        return "Error: Invalid hex string length";
    }*/

    var inst = "";
    var regA = "";
    var regB = "";
    var regC = "";
    var str1 = "";
    var str2 = "";
    var str3 = "";

    if (opcode == "7") {
        return "HALT";
    } else if (opcode == "A") {
        return "EI";
    } else if (opcode == "B") {
        return "DI";
    } else if (opcode == "C") {
        return "RETI";
    } else {

        regA = hexStr.charAt(1);
        regB = hexStr.charAt(2);

        if (opcode == "0"){
            inst = "ADD";
            regC = hexStr.charAt(7);
            str1 = regnoToStr(regA);
            str2 = regnoToStr(regB);
            str3 = regnoToStr(regC);
        } else if (opcode == "1") {
            inst = "NAND";
            regC = hexStr.charAt(7);
            str1 = regnoToStr(regA);
            str2 = regnoToStr(regB);
            str3 = regnoToStr(regC);
        } else if (opcode == "2") {
            inst = "ADDI";
            str1 = regnoToStr(regA);
            str2 = regnoToStr(regB);
            str3 = parseInt(hexStr.substring(3,8),16);
        } else if (opcode == "3") {
            inst = "LW";
            str1 = regnoToStr(regA);
            str2 = "0x" + parseInt(hexStr.substring(3,8),16).toString(16) + "(" + regnoToStr(regB) + ")";
        } else if (opcode == "4") {
            inst = "SW";
            str1 = regnoToStr(regA);
            str2 = regnoToStr(regB);
            str2 = "0x" + parseInt(hexStr.substring(3,8),16).toString(16) + "(" + regnoToStr(regB) + ")";
        } else if (opcode == "5") {
            inst = "BEQ";
            str1 = regnoToStr(regA);
            str2 = regnoToStr(regB);
            str3 = parseInt(hexStr.substring(3,8),16);
        } else if (opcode == "6") {
            inst = "JALR";
        }
    }

    return inst + " " + str1 + ", " + str2 + (str3 === "" ?  "" : ", " + str3);
}

function regnoToStr(regno) {
    if (regno == "0") {
        return "$zero";
    } else if (regno == "1") {
        return "$at";
    } else if (regno == "2") {
        return "$v0";
    } else if (regno == "3") {
        return "$a0";
    } else if (regno == "4") {
        return "$a1";
    } else if (regno == "5") {
        return "$a2";
    } else if (regno == "6") {
        return "$t0";
    } else if (regno == "7") {
        return "$t1";
    } else if (regno == "8") {
        return "$t2";
    } else if (regno == "9") {
        return "$s0";
    } else if (regno == "A") {
        return "$s1";
    } else if (regno == "B") {
        return "$s2";
    } else if (regno == "C") {
        return "$k0";
    } else if (regno == "D") {
        return "$sp";
    } else if (regno == "E") {
        return "$fp";
    } else if (regno == "F") {
        return "$ra";
    }
}

function highlight_line(line_num) {
    editor.addLineClass(line_num, 'wrap', 'CodeMirror-activeline-background')
}

function remove_line_highlight(line_num) {
    editor.removeLineClass(line_num, 'CodeMirror-activeline-background')
}

function goto_vlist_line(line_num) {
    vlist.scrollTop = line_num * 15;
}

var tooltip_drag_event = function() {};
var dragging_tooltip;
var tooltips = [];
var tooltip_num = 0;

document.body.addEventListener("mousemove", function(e) {
    tooltip_drag_event(e);
});

document.body.addEventListener("click", function() {
    var to_remove = [];
    for (var i = 0; i < tooltips.length; i++) {
        if (tooltips[i].pin_div.getAttribute("pinned") == "false") {
            to_remove.push(tooltips[i]);
        }
    }

    while (to_remove.length > 0) {
        to_remove.pop().remove();
    }
});

function Tooltip(datapath_attribute, pos_x, pos_y, name) {
    name = name == undefined ? datapath_attribute : name;

    this.tooltip_num = tooltip_num;
    tooltip_num++;
    this.name = name;
    this.datapath_attribute = datapath_attribute;
    this.pos_x = pos_x;
    this.pos_y = pos_y;

    this.div = document.createElement("div");
    this.div.className = "tooltip noselect";

    this.name_span = document.createElement("span");
    this.name_span.innerHTML = name + ": ";

    this.value_span = document.createElement("span");
    this.value_span.className = "tooltip_value";

    this.pin_div = document.createElement("div");
    this.pin_div.className = "tooltip_pin";
    this.pin_div.setAttribute("pinned", "false");
    this.pin_div.addEventListener("click", function(e) {
        if (e.target.getAttribute("pinned") == "false") {
            e.target.className += " tooltip_x";
            e.target.setAttribute("pinned", "true");
        } else {
            for (var i = 0; i < tooltips.length; i++) {
                if (tooltips[i].tooltip_num == parseInt(e.target.parentNode.getAttribute("tooltip_num"))) {
                    tooltips[i].remove();
                    break;
                }
            }
        }
    });

    this.div.style.left = ((this.pos_x / window.innerWidth) * 100) + "%";
    this.div.style.top = ((this.pos_y / window.innerHeight) * 100) + "%";
    this.div.setAttribute("tooltip_num", this.tooltip_num);

    this.div.appendChild(this.name_span);
    this.div.appendChild(this.value_span);
    this.div.appendChild(this.pin_div);

    select("id", "tooltips").js_object.appendChild(this.div);

    this.update_value = function() {
        this.value_span.innerHTML = to_hex(datapath[datapath_attribute]);
    };

    this.div.addEventListener("mousedown", function(e) {
        var tooltip;
        if (e.target.className != "tooltip noselect") {
            tooltip = e.target.parentNode;
        } else {
            tooltip = e.target;
        }
        dragging_tooltip = tooltip;

        document.body.className = "noselect";

        var bounds = tooltip.getBoundingClientRect();
        var offset_x = e.pageX - bounds.left;
        var offset_y = e.pageY - bounds.top;

        tooltip_drag_event = function(e) {
            dragging_tooltip.style.left = (((e.pageX - offset_x) / window.innerWidth) * 100) + "%";
            dragging_tooltip.style.top = (((e.pageY - offset_y) / window.innerHeight) * 100) + "%";
        }
    });

    this.div.addEventListener("click", function(e) {
        e.stopPropagation();
    });

    this.div.addEventListener("mouseup", function(e) {
        dragging_tooltip = null;
        document.body.className = "";
        tooltip_drag_event = function() {};
    });

    this.remove = function() {
        var new_tooltips = [];
        for (var i = 0; i < tooltips.length; i++) {
            if (tooltips[i].tooltip_num != this.tooltip_num) {
                new_tooltips.push(tooltips[i]);
            }
        }
        tooltips = new_tooltips;

        this.div.remove();
    };

    tooltips.push(this);
    this.update_value();
    return this;
}