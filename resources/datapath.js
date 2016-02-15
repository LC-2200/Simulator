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

const MICROCODE = [["FETCH0", 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["FETCH1", 2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["FETCH2", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 1, 0],
                   ["ADD0", 4, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["ADD1", 5, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                   ["ADD2", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                   ["NAND0", 7, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["NAND1", 8, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                   ["NAND2", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
                   ["ADDI0", 10, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["ADDI1", 11, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["ADDI2", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                   ["LW0", 13, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["LW1", 14, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["LW2", 15, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["LW3", 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                   ["SW0", 17, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["SW1", 18, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["SW2", 19, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["SW3", 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                   ["BEQ0", 21, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["BEQ1", 22, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                   ["BEQ2", 23, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0],
                   ["BEQ3", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                   ["BEQ4", 25, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["BEQ5", 26, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                   ["BEQ6", 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                   ["JALR0", 28, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
                   ["JALR1", 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                   ["HALT", 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

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
    for (var i = 0; i < datapath.registers.length; i++) {
        datapath.registers[i] = 0;
    }
    datapath.regno = 0;
    datapath.state = 0;
    datapath.Z = 0;
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
        console.log("RX: " + datapath.regno);
    } else if (current_state[LOOKUP.regSel] == 1) {
        datapath.regno = datapath.IR << 8 >>> 28; // Ry is bits 23 - 20.
        console.log("RY: " + datapath.regno);
    } else {
        datapath.regno = datapath.IR & 0xF; // Rz is bits 3 - 0.
        console.log("RZ: " + datapath.regno);
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
        datapath.registers[datapath.regno] = datapath.bus;
    }
}

function update_memory() {
    if (current_state[LOOKUP.wrMem] == 1) {
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


function datapath_on_forward_microstate_click(e, editor) {
    if (!disable_stepping) {
        update_state();
        update_datapath_ui();
    }
}

function datapath_on_back_microstate_click(e, editor) {
    // todo
}

function datapath_on_back_click(e, editor) {
    // todo
}

var disable_stepping = false;

function datapath_on_forward_click(e, editor) {
    if (!disable_stepping) {
        disable_stepping = true;
        update_state();
        update_datapath_ui();
        setTimeout(datapath_on_forward_click_timeout, 500);
    }
}

function datapath_on_forward_click_timeout(e, editor) {
    if (datapath.state != 0) {
        update_state();
        update_datapath_ui();
        setTimeout(datapath_on_forward_click_timeout, 500);
    } else {
        disable_stepping = false;
    }
}

function datapath_on_load_click(e, editor) {
    // todo
}

function update_datapath_ui() {
    set_datapath_element("bus", !(datapath.bus === null));
    set_datapath_element("drAlu", current_state[LOOKUP.drAlu] == 1);
    set_datapath_element("drMem", current_state[LOOKUP.drMem] == 1);
    set_datapath_element("drOff", current_state[LOOKUP.drOff] == 1);
    set_datapath_element("drPc", current_state[LOOKUP.drPc] == 1);
    set_datapath_element("drReg", current_state[LOOKUP.drReg] == 1);
    set_datapath_element("ldA", current_state[LOOKUP.ldA] == 1);
    set_datapath_element("ldB", current_state[LOOKUP.ldB] == 1);
    set_datapath_element("ldIr", current_state[LOOKUP.ldIr] == 1);
    set_datapath_element("ldMar", current_state[LOOKUP.ldMar] == 1);
    set_datapath_element("ldPc", current_state[LOOKUP.ldPc] == 1);
    set_datapath_element("ldZ", current_state[LOOKUP.ldZ] == 1);
    set_datapath_element("wrReg", current_state[LOOKUP.wrReg] == 1);
    set_datapath_element("wrMem", current_state[LOOKUP.wrMem] == 1);


    select("id", "datapath_register_0_value").js_object.textContent = to_hex(datapath.registers[0]);
    select("id", "datapath_register_1_value").js_object.textContent = to_hex(datapath.registers[1]);
    select("id", "datapath_register_2_value").js_object.textContent = to_hex(datapath.registers[2]);
    select("id", "datapath_register_3_value").js_object.textContent = to_hex(datapath.registers[3]);
    select("id", "datapath_register_4_value").js_object.textContent = to_hex(datapath.registers[4]);
    select("id", "datapath_register_5_value").js_object.textContent = to_hex(datapath.registers[5]);
    select("id", "datapath_register_6_value").js_object.textContent = to_hex(datapath.registers[6]);
    select("id", "datapath_register_7_value").js_object.textContent = to_hex(datapath.registers[7]);
    select("id", "datapath_register_8_value").js_object.textContent = to_hex(datapath.registers[8]);
    select("id", "datapath_register_9_value").js_object.textContent = to_hex(datapath.registers[9]);
    select("id", "datapath_register_10_value").js_object.textContent = to_hex(datapath.registers[10]);
    select("id", "datapath_register_11_value").js_object.textContent = to_hex(datapath.registers[11]);
    select("id", "datapath_register_12_value").js_object.textContent = to_hex(datapath.registers[12]);
    select("id", "datapath_register_13_value").js_object.textContent = to_hex(datapath.registers[13]);
    select("id", "datapath_register_14_value").js_object.textContent = to_hex(datapath.registers[14]);
    select("id", "datapath_register_15_value").js_object.textContent = to_hex(datapath.registers[15]);
    select("id", "datapath_bus_value").js_object.textContent = to_hex(datapath.bus);
    select("id", "datapath_regno_value").js_object.textContent = to_hex(datapath.regno);
    select("id", "datapath_func_value").js_object.textContent = to_hex(datapath.func);
    select("id", "datapath_pc_value").js_object.textContent = to_hex(datapath.PC);
    select("id", "datapath_ir_value").js_object.textContent = to_hex(datapath.IR);
    select("id", "datapath_a_value").js_object.textContent = to_hex(datapath.A);
    select("id", "datapath_b_value").js_object.textContent = to_hex(datapath.B);
    select("id", "datapath_mar_value").js_object.textContent = to_hex(datapath.MAR);
    select("id", "datapath_current_instruction_name").js_object.textContent = current_state[LOOKUP.name];
}

function get_mem_value(addr) {
    return to_hex(datapath.mem[addr]);
}

function set_datapath_element(elem, activate) {
    set_datapath_element_color(elem, activate ? 'rgb(54,187,204)' : 'rgb(255,255,255)');
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
    for(var i = 0; i < values.length; i++) {
        datapath.mem[start + i] = values[i];
    }
    update_mem_view(start);
}