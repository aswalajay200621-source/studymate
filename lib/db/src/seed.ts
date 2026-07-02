import { db } from "./index";
import {
  semestersTable,
  subjectsTable,
  chaptersTable,
  flashcardsTable,
  quizQuestionsTable,
} from "./schema";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clear existing data (in order of dependencies)
  console.log("🧹 Clearing old seed data...");
  await db.delete(quizQuestionsTable);
  await db.delete(flashcardsTable);
  await db.delete(chaptersTable);
  await db.delete(subjectsTable);
  await db.delete(semestersTable);

  // 2. Seed Semesters
  console.log("📚 Seeding Semesters...");
  await db.insert(semestersTable).values([
    { id: "cse-sem1", name: "Semester 1", college: "CSE", orderIndex: 1 },
    { id: "cse-sem2", name: "Semester 2", college: "CSE", orderIndex: 2 },
    { id: "eee-sem1", name: "Semester 1", college: "EEE", orderIndex: 1 },
    { id: "eee-sem2", name: "Semester 2", college: "EEE", orderIndex: 2 },
  ]);

  // 3. Seed Subjects
  console.log("📖 Seeding Subjects...");
  await db.insert(subjectsTable).values([
    {
      id: "cse-cp",
      name: "Computer Programming",
      code: "CSE-101",
      semester: 1,
      semesterId: "cse-sem1",
      college: "CSE",
      description: "Introduction to programming, algorithms, C syntax, pointers, and memory layout.",
      color: "#7C5CFC",
      icon: "code-slash",
    },
    {
      id: "cse-dld",
      name: "Digital Logic Design",
      code: "CSE-102",
      semester: 2,
      semesterId: "cse-sem2",
      college: "CSE",
      description: "Boolean algebra, Karnaugh maps, logic gates, combinational and sequential logic.",
      color: "#EC4899",
      icon: "hardware-chip",
    },
    {
      id: "eee-bee",
      name: "Basic Electrical Eng.",
      code: "EEE-101",
      semester: 1,
      semesterId: "eee-sem1",
      college: "EEE",
      description: "Fundamental laws of DC & AC circuits, electromagnetism, and electrical machines.",
      color: "#10B981",
      icon: "flash",
    },
    {
      id: "eee-ct",
      name: "Circuit Theory",
      code: "EEE-102",
      semester: 2,
      semesterId: "eee-sem2",
      college: "EEE",
      description: "Advanced network analysis, Laplace transforms, transient state, and two-port networks.",
      color: "#3B82F6",
      icon: "git-network",
    },
  ]);

  // 4. Seed Chapters
  console.log("📑 Seeding Chapters...");
  await db.insert(chaptersTable).values([
    // Computer Programming Chapters
    {
      id: "cp-ch1",
      subjectId: "cse-cp",
      title: "Introduction to C & Data Types",
      contentHtml: `
        <h3>1. Structure of a C Program</h3>
        <p>A standard C program begins with preprocessor directives, followed by the main function where execution starts:</p>
        <pre><code>#include &lt;stdio.h&gt;\n\nint main() {\n    printf("Hello, StudyMate!");\n    return 0;\n}</code></pre>
        <h3>2. Basic Data Types and Sizes</h3>
        <ul>
          <li><strong>int:</strong> 4 bytes (normally) to store integers.</li>
          <li><strong>char:</strong> 1 byte to store a single character.</li>
          <li><strong>float:</strong> 4 bytes to store decimal values.</li>
          <li><strong>double:</strong> 8 bytes to store double-precision decimal values.</li>
        </ul>
        <p>Memory layout dictates that variables are stored in sequential stack locations unless allocated dynamically via <code>malloc</code>.</p>
      `,
      summary: "Understand the layout of a C program, the compilation lifecycle, and default variable byte sizes in memory.",
      orderIndex: 1,
    },
    {
      id: "cp-ch2",
      subjectId: "cse-cp",
      title: "Control Flow & Decision Making",
      contentHtml: `
        <h3>1. Conditional Statements</h3>
        <p>C uses <code>if</code>, <code>else if</code>, <code>else</code>, and <code>switch</code> to control execution branches based on Boolean expressions.</p>
        <h3>2. Loops in C</h3>
        <ul>
          <li><strong>For Loops:</strong> Best when the number of iterations is known beforehand.</li>
          <li><strong>While Loops:</strong> Entry-controlled loop; checks condition before executing block.</li>
          <li><strong>Do-While Loops:</strong> Exit-controlled loop; executes the block at least once.</li>
        </ul>
      `,
      summary: "Master branching structures (if/else, switch) and loop paradigms (for, while, do-while).",
      orderIndex: 2,
    },

    // Digital Logic Design Chapters
    {
      id: "dld-ch1",
      subjectId: "cse-dld",
      title: "Number Systems & Boolean Algebra",
      contentHtml: `
        <h3>1. Radix Conversions</h3>
        <p>Learn how to convert numbers between Binary (base 2), Octal (base 8), Decimal (base 10), and Hexadecimal (base 16).</p>
        <h3>2. Boolean Theorems</h3>
        <p>Understand the foundational laws of boolean simplification:</p>
        <ul>
          <li><strong>Identity Law:</strong> A + 0 = A, A • 1 = A</li>
          <li><strong>De Morgan's Theorem:</strong> (A + B)' = A' • B' and (A • B)' = A' + B'</li>
        </ul>
      `,
      summary: "Converting binary/hex and simplifying boolean expressions using De Morgan's theorems.",
      orderIndex: 1,
    },
    {
      id: "dld-ch2",
      subjectId: "cse-dld",
      title: "Logic Gates & Combinational Circuits",
      contentHtml: `
        <h3>1. Logic Gates</h3>
        <p>Primary logic gates include AND, OR, NOT. Universal gates include NAND and NOR (any logic circuit can be built exclusively from these).</p>
        <h3>2. Multiplexers & Decoders</h3>
        <p>A multiplexer (MUX) selects one input line from several and forwards it to a single output line.</p>
      `,
      summary: "Basic gate operations, universal NAND/NOR logic, and multiplexer routing mechanisms.",
      orderIndex: 2,
    },

    // Basic Electrical Chapters
    {
      id: "bee-ch1",
      subjectId: "eee-bee",
      title: "DC Analysis & Network Theorems",
      contentHtml: `
        <h3>1. Ohm's Law and Kirchhoff's Laws</h3>
        <p>Kirchhoff's Current Law (KCL) states total current entering a node equals total current leaving. Kirchhoff's Voltage Law (KVL) states sum of voltages in a closed loop is zero.</p>
        <h3>2. Thevenin's & Norton's Theorems</h3>
        <p>Any linear active two-terminal network can be replaced by an equivalent voltage source in series with a resistor (Thevenin), or equivalent current source in parallel with a resistor (Norton).</p>
      `,
      summary: "Master node/mesh analysis using KVL, KCL, and simplifying circuits via Thevenin equivalents.",
      orderIndex: 1,
    },

    // Circuit Theory Chapters
    {
      id: "ct-ch1",
      subjectId: "eee-ct",
      title: "Transient Response of RL/RC Circuits",
      contentHtml: `
        <h3>1. Transient vs. Steady State</h3>
        <p>When switch state changes, inductors and capacitors undergo a transient state transition described by differential equations before settling to DC steady state.</p>
        <h3>2. Time Constant (τ)</h3>
        <ul>
          <li><strong>RC Circuit:</strong> τ = R * C</li>
          <li><strong>RL Circuit:</strong> τ = L / R</li>
        </ul>
      `,
      summary: "Mathematical analysis of voltage and current transients in capacitor and inductor networks.",
      orderIndex: 1,
    },
  ]);

  // 5. Seed Flashcards
  console.log("🎴 Seeding Flashcards...");
  await db.insert(flashcardsTable).values([
    // Computer Programming Flashcards
    {
      chapterId: "cp-ch1",
      question: "What is the size of a standard integer in C on 32/64 bit systems?",
      answer: "Typically 4 bytes (32 bits).",
      orderIndex: 1,
    },
    {
      chapterId: "cp-ch1",
      question: "Which preprocessor directive is used to include standard I/O libraries?",
      answer: "#include <stdio.h>",
      orderIndex: 2,
    },
    {
      chapterId: "cp-ch2",
      question: "What is the main difference between while and do-while loops?",
      answer: "while is entry-controlled (checks condition first); do-while is exit-controlled (always executes at least once).",
      orderIndex: 1,
    },

    // Digital Logic Design Flashcards
    {
      chapterId: "dld-ch1",
      question: "What does De Morgan's Theorem state for (A + B)' ?",
      answer: "A' • B'",
      orderIndex: 1,
    },
    {
      chapterId: "dld-ch2",
      question: "Why are NAND and NOR called universal gates?",
      answer: "Because any logic function (AND, OR, NOT, etc.) can be constructed using only NAND or only NOR gates.",
      orderIndex: 1,
    },

    // Basic Electrical Flashcards
    {
      chapterId: "bee-ch1",
      question: "What is Kirchhoff's Current Law (KCL)?",
      answer: "The algebraic sum of currents entering a node is equal to zero (conservation of charge).",
      orderIndex: 1,
    },
  ]);

  // 6. Seed Quiz Questions
  console.log("❓ Seeding Quiz Questions...");
  await db.insert(quizQuestionsTable).values([
    // Computer Programming Quizzes
    {
      chapterId: "cp-ch1",
      question: "Which of the following is NOT a valid C data type?",
      options: ["int", "char", "boolean", "double"],
      correctIndex: 2,
      explanation: "C does not have a native 'boolean' keyword. Instead, it traditionally uses 0 for false and non-zero values for true, or includes <stdbool.h>.",
      orderIndex: 1,
    },
    {
      chapterId: "cp-ch1",
      question: "What is the return type of the main() function in a standard C program?",
      options: ["void", "int", "float", "char"],
      correctIndex: 1,
      explanation: "The standard signature is `int main()`, returning 0 on success to indicate a clean exit status to the operating system.",
      orderIndex: 2,
    },
    {
      chapterId: "cp-ch2",
      question: "Which loop is guaranteed to execute at least once?",
      options: ["for", "while", "do-while", "none of the above"],
      correctIndex: 2,
      explanation: "A do-while loop evaluates its conditional check at the end of the block iteration, guaranteeing at least one execution pass.",
      orderIndex: 1,
    },

    // Digital Logic Design Quizzes
    {
      chapterId: "dld-ch1",
      question: "What is the binary representation of decimal number 13?",
      options: ["1011", "1100", "1101", "1110"],
      correctIndex: 2,
      explanation: "13 in binary is calculated as: 8 (2^3) + 4 (2^2) + 0 (2^1) + 1 (2^0) = 1101.",
      orderIndex: 1,
    },

    // Basic Electrical Quizzes
    {
      chapterId: "bee-ch1",
      question: "Which theorem replaces a linear network with a single voltage source and series resistor?",
      options: ["Norton's Theorem", "Superposition Theorem", "Thevenin's Theorem", "Millman's Theorem"],
      correctIndex: 2,
      explanation: "Thevenin's Theorem replaces a complex linear network with a single equivalent voltage source (Vth) in series with a resistor (Rth).",
      orderIndex: 1,
    },
  ]);

  console.log("🎉 Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
