var datapath = {
    bus: 0x00000000,
    stateName: "FETCH0",
    state: 0,
    nextState: 1,
    ldA: 1,
    ldB: 0,
    ldIR: 0,
    ldMAR: 1,
    ldPC: 0,
    ldZ: 0,
    wrReg: 0,
    wrMem: 0,
    drReg: 0,
    drMem: 0,
    drOff: 0,
    drPC: 1,
    drALU: 0,
    ALUSel: 0,
    regSel: 0,
    opTest: 0,
    chkZ: 0,
    IR: 0x00000000,
    MAR: 0x00000000,
    A: 0x00000000,
    B: 0x00000000,
    PC: 0x00000000,
    Z: 0,
    registers: [0x0000000,0x0000000,0x0000000,0x0000000,
                0x0000000,0x0000000,0x0000000,0x0000000,
                0x0000000,0x0000000,0x0000000,0x0000000,
                0x0000000,0x0000000,0x0000000,0x0000000],
    mem: [0x0000000,0x0000000,0x0000000,0x0000000,
          0x0000000,0x0000000,0x0000000,0x0000000,
          0x0000000,0x0000000,0x0000000,0x0000000,
          0x0000000,0x0000000,0x0000000,0x0000000]
};

const MICROCODE = [["FETCH0",1,0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0,0],
                   ["FETCH1",2,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
                   ["FETCH2",0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,3,1,0],
                   ["ADD0",4,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0],
                   ["ADD1",5,0,0,0,0,1,0,1,0,0,0,0,0,0,2,0,0,0],
                   ["ADD2",0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                   ["NAND0",7,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0],
                   ["NAND1",8,0,0,0,0,1,0,1,0,0,0,0,0,0,2,0,0,0],
                   ["NAND2",0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
                   ["ADDI0",10,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0],
                   ["ADDI1",11,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                   ["ADDI2",0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                   ["LW0",13,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0],
                   ["LW1",14,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                   ["LW2",15,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                   ["LW3",0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                   ["SW0",17,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0],
                   ["SW1",18,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                   ["SW2",19,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
                   ["SW3",0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
                   ["BEQ0",21,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
                   ["BEQ1",22,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0],
                   ["BEQ2",23,1,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0],
                   ["BEQ3",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                   ["BEQ4",25,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                   ["BEQ5",26,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
                   ["BEQ6",0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                   ["JALR0",28,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0],
                   ["JALR1",0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
                   ["HALT",29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];

const OP_TABLE = [3,6,9,12,16,20,27,29];
const Z_TABLE = [0,23]

function datapath_on_forward_microstate_click(e, editor) {

    // Update control signals
    var state = datapath.nextState;
    if (datapath.opTest == 1) {
        state = OP_TABLE[datapath.IR >>> 28]; // Index by op code.
    } else if (datapath.chkZ == 1) {
        state = Z_TABLE[datapath.Z == 1];
    }
    var nextState = MICROCODE[state];
    datapath.state = state;
    datapath.stateName = nextState[0];
    datapath.nextState = nextState[1];
    datapath.drALU = nextState[2];
    datapath.drMem = nextState[3];
    datapath.drOff = nextState[4];
    datapath.drPC = nextState[5];
    datapath.drReg = nextState[6];
    datapath.ldA = nextState[7];
    datapath.ldB = nextState[8];
    datapath.ldIR = nextState[9];
    datapath.ldMAR = nextState[10];
    datapath.ldPC = nextState[11];
    datapath.ldZ = nextState[12];
    datapath.wrReg = nextState[13];
    datapath.wrMem = nextState[14];
    if (nextState[15] == 0) {
        datapath.regSel = datapath.IR << 4 >>> 28;
    } else if (nextState[15] == 1) {
        datapath.regSel = datapath.IR << 8 >>> 28;
    } else {
        datapath.regSel = datapath | 0xF;
    }
    datapath.ALUSel = nextState[16];
    datapath.opTest = nextState[17];
    datapath.chkZ = nextState[18];

    // Get Value onto bus
    if (datapath.drPC == 1) {
        datapath.bus = datapath.PC;
    } else if (datapath.drALU == 1) {
        if (datapath.ALUSel == 0) {
            datapath.bus = datapath.A + datapath.B;
        } else if (datapath.ALUSel == 1) {
            datapath.bus = ~(datapath.A  & datapath.B);
        } else if (datapath.ALUSel == 2) {
            datapath.bus = datapath.A  - datapath.B;
        } else if (datapath.ALUSel == 3) {
            datapath.bus = datapath.A  + 1;
        }
    } else if (datapath.drReg == 1) {
        datapath.bus = datapath.registers[datapath.regSel];
    } else if (datapath.drMem == 1) {
        datapath.bus = datapath.mem[datapath.MAR];
    } else if (datapath.drOff == 1) {
        datapath.bus = datapath.IR << 12 >> 12;
    }

    // Pull values off bus
    if (datapath.ldPC == 1) {
        datapath.PC = datapath.bus;
    }
    if (datapath.ldA == 1) {
        datapath.A = datapath.bus;
    }
    if (datapath.ldB == 1) {
        datapath.B = datapath.bus;
    }
    if (datapath.ldMAR == 1) {
        datapath.MAR = datapath.bus;
    }
    if (datapath.ldIR == 1) {
        datapath.IR = datapath.bus;
    }
    if (datapath.ldZ == 1) {
        datapath.A = datapath.bus == 0 ? 1 : 0;
    }
    if (datapath.wrReg == 1) {
        alert(datapath.regSel + " : " + datapath.bus);
        datapath.registers[datapath.regSel] = datapath.bus;
    }
    if (datapath.wrMem == 1) {
        datapath.mem[datapath.MAR] = datapath.bus;
    }

    update_datapath_ui()
}

function datapath_on_back_microstate_click(e, editor) {
    // todo
}

function datapath_on_back_click(e, editor) {
    // todo
}

function datapath_on_forward_click(e, editor) {
    if (datapath.state == 0) {
        datapath_on_forward_microstate_click(e, editor);
    }
    while (datapath.state != 0) {
        datapath_on_forward_microstate_click(e, editor);
    }
}

function datapath_on_load_click(e, editor) {
    // todo
}

function update_datapath_ui() {
    // todo
    select("id", "datapath_bus_value").js_object.innerHTML = datapath.bus;
    for (var i = 0; i < 16; i++) {
        select("id", "datapath_register_" + i + "_value").js_object.innerHTML = datapath.registers[i];
    }
    select("id", "datapath_regsel_value").js_object.innerHTML = datapath.regSel;
    select("id", "datapath_alusel_value").js_object.innerHTML = datapath.ALUSel;
    select("id", "datapath_pc_value").js_object.innerHTML = datapath.PC;
    select("id", "datapath_ir_value").js_object.innerHTML = datapath.IR;
    select("id", "datapath_a_value").js_object.innerHTML = datapath.A;
    select("id", "datapath_b_value").js_object.innerHTML = datapath.B;
    select("id", "datapath_mar_value").js_object.innerHTML = datapath.MAR;

}