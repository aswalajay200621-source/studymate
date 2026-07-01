export type College = "CSE" | "EEE";

export type ContentBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "tip"; text: string }
  | { type: "definition"; term: string; definition: string };

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: ContentBlock[];
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: 1 | 2;
  college: College;
  description: string;
  color: string;
  icon: string;
  chapters: Chapter[];
}

export const subjects: Subject[] = [
  {
    id: "cse-prog-c",
    name: "Programming in C",
    code: "CS1001",
    semester: 1,
    college: "CSE",
    description: "Fundamentals of programming using the C language",
    color: "#4361EE",
    icon: "code-slash",
    chapters: [
      {
        id: "cse-prog-c-ch1",
        title: "Variables and Data Types",
        summary:
          "C provides several built-in data types: int (integers), float/double (decimals), char (characters), and void. Variables are named memory locations declared with a type. The size of each type can vary by platform but follows minimum guarantees. Type modifiers like signed, unsigned, short, and long further refine storage. Always initialize variables before use to avoid undefined behavior.",
        content: [
          {
            type: "heading",
            level: 1,
            text: "Variables and Data Types in C",
          },
          {
            type: "paragraph",
            text: "A variable is a named storage location in memory that holds a value. In C, every variable must be declared with a specific data type before it can be used. The data type tells the compiler how much memory to allocate and how to interpret the stored bits.",
          },
          {
            type: "heading",
            level: 2,
            text: "Primitive Data Types",
          },
          {
            type: "list",
            items: [
              "int — Stores whole numbers (e.g., 42, -7). Typically 4 bytes.",
              "float — Single-precision decimal numbers (e.g., 3.14). 4 bytes.",
              "double — Double-precision decimals, more accurate. 8 bytes.",
              "char — A single character stored as its ASCII value. 1 byte.",
              "void — Represents the absence of a type (used for functions).",
            ],
          },
          {
            type: "heading",
            level: 2,
            text: "Declaring Variables",
          },
          {
            type: "paragraph",
            text: "To declare a variable, specify the type followed by the variable name. You can also initialize it at declaration.",
          },
          {
            type: "code",
            language: "c",
            code: `int age = 20;\nfloat gpa = 8.75;\nchar grade = 'A';\ndouble pi = 3.14159265358979;`,
          },
          {
            type: "heading",
            level: 2,
            text: "Type Modifiers",
          },
          {
            type: "paragraph",
            text: "C provides modifiers that alter the storage of basic types:",
          },
          {
            type: "definition",
            term: "unsigned int",
            definition:
              "Only stores non-negative values (0 to 4,294,967,295 on 32-bit systems), doubling the positive range.",
          },
          {
            type: "definition",
            term: "short int",
            definition:
              "Uses less memory (typically 2 bytes), range: -32,768 to 32,767.",
          },
          {
            type: "definition",
            term: "long int",
            definition:
              "Larger range, typically 8 bytes on 64-bit systems.",
          },
          {
            type: "tip",
            text: "Always initialize variables before reading them. Reading an uninitialized variable gives garbage values — a common source of bugs in C programs.",
          },
          {
            type: "heading",
            level: 2,
            text: "The sizeof Operator",
          },
          {
            type: "paragraph",
            text: "Use sizeof() to find how many bytes a type or variable occupies on your system.",
          },
          {
            type: "code",
            language: "c",
            code: `#include <stdio.h>\nint main() {\n    printf("int: %zu bytes\\n", sizeof(int));\n    printf("double: %zu bytes\\n", sizeof(double));\n    return 0;\n}`,
          },
        ],
        flashcards: [
          {
            question: "What is the size of int on a typical 32-bit system?",
            answer: "4 bytes (32 bits), storing values from -2,147,483,648 to 2,147,483,647.",
          },
          {
            question: "What is the difference between float and double?",
            answer: "float is single-precision (4 bytes, ~7 decimal digits). double is double-precision (8 bytes, ~15 decimal digits) — more accurate.",
          },
          {
            question: "What does 'unsigned' modifier do?",
            answer: "It removes the sign bit, so the variable can only store non-negative values but with a larger positive range.",
          },
          {
            question: "How do you store a single character in C?",
            answer: "Use the char data type: char letter = 'A'; — it stores the ASCII value (65 for 'A') in 1 byte.",
          },
          {
            question: "What is the purpose of the sizeof() operator?",
            answer: "It returns the size in bytes of a type or variable on the current system, useful for portable code.",
          },
        ],
        quiz: [
          {
            question: "Which data type would you use to store a student's CGPA (e.g., 8.75)?",
            options: ["int", "char", "float", "void"],
            correctIndex: 2,
            explanation: "float (or double) stores decimal numbers. int only holds whole numbers, char stores single characters, and void represents no type.",
          },
          {
            question: "What is the output of: printf(\"%d\", sizeof(char));",
            options: ["2", "4", "1", "8"],
            correctIndex: 2,
            explanation: "char is always 1 byte in C — this is guaranteed by the C standard regardless of the platform.",
          },
          {
            question: "Which declaration is CORRECT in C?",
            options: [
              "int 1count = 0;",
              "float avg = 8.5;",
              "char name = \"Ravi\";",
              "double = 3.14;",
            ],
            correctIndex: 1,
            explanation: "Variable names cannot start with a digit (1count). Strings need double quotes and char* type. A variable name is required in every declaration.",
          },
          {
            question: "What value does an uninitialized local int variable hold in C?",
            options: ["0", "NULL", "Garbage value", "-1"],
            correctIndex: 2,
            explanation: "Local variables in C are not automatically initialized. They hold whatever value was previously in that memory location — a garbage value.",
          },
        ],
      },
      {
        id: "cse-prog-c-ch2",
        title: "Control Flow: If-Else and Loops",
        summary:
          "Control flow statements direct program execution. if-else chooses between code paths based on conditions. Loops (for, while, do-while) repeat code blocks. The for loop is used when the iteration count is known. while repeats as long as a condition is true. do-while always runs at least once. break exits a loop early; continue skips to the next iteration.",
        content: [
          {
            type: "heading",
            level: 1,
            text: "Control Flow in C",
          },
          {
            type: "paragraph",
            text: "By default, a C program executes statements from top to bottom. Control flow statements let you change this order based on conditions or repeat sections of code.",
          },
          {
            type: "heading",
            level: 2,
            text: "The if-else Statement",
          },
          {
            type: "code",
            language: "c",
            code: `int marks = 75;\nif (marks >= 90) {\n    printf("Grade: O\\n");\n} else if (marks >= 75) {\n    printf("Grade: A\\n");\n} else if (marks >= 60) {\n    printf("Grade: B\\n");\n} else {\n    printf("Grade: C\\n");\n}`,
          },
          {
            type: "heading",
            level: 2,
            text: "The for Loop",
          },
          {
            type: "paragraph",
            text: "Use the for loop when you know how many times to repeat. It has three parts: initialization, condition, and update.",
          },
          {
            type: "code",
            language: "c",
            code: `for (int i = 1; i <= 5; i++) {\n    printf("%d ", i);\n}\n// Output: 1 2 3 4 5`,
          },
          {
            type: "heading",
            level: 2,
            text: "The while Loop",
          },
          {
            type: "code",
            language: "c",
            code: `int n = 1;\nwhile (n <= 10) {\n    printf("%d\\n", n);\n    n++;\n}`,
          },
          {
            type: "heading",
            level: 2,
            text: "break and continue",
          },
          {
            type: "list",
            items: [
              "break — immediately exits the innermost loop or switch.",
              "continue — skips the rest of the current iteration and moves to the next.",
            ],
          },
          {
            type: "tip",
            text: "Avoid infinite loops by ensuring the loop condition eventually becomes false. Always double-check your update expression.",
          },
        ],
        flashcards: [
          {
            question: "What is the difference between while and do-while loops?",
            answer: "while checks the condition BEFORE executing the body. do-while checks AFTER, so it always runs at least once.",
          },
          {
            question: "What does the break statement do inside a loop?",
            answer: "It immediately terminates the innermost loop and transfers control to the statement following the loop.",
          },
          {
            question: "What are the three parts of a for loop header?",
            answer: "Initialization (runs once at start), Condition (checked before each iteration), Update (runs after each iteration).",
          },
          {
            question: "When does a while loop body NOT execute at all?",
            answer: "When the condition is false from the very beginning.",
          },
        ],
        quiz: [
          {
            question: "How many times does the following loop execute: for(int i=0; i<5; i++)?",
            options: ["4", "5", "6", "Infinite"],
            correctIndex: 1,
            explanation: "i goes from 0 to 4 (while i < 5), which is exactly 5 iterations: i=0,1,2,3,4.",
          },
          {
            question: "Which loop guarantees at least one execution of its body?",
            options: ["for", "while", "do-while", "All of the above"],
            correctIndex: 2,
            explanation: "do-while checks the condition after the body executes, so the body always runs at least once, even if the condition is false.",
          },
          {
            question: "What does 'continue' do in a loop?",
            options: [
              "Exits the loop",
              "Restarts the entire program",
              "Skips the rest of the current iteration",
              "Pauses the loop",
            ],
            correctIndex: 2,
            explanation: "continue skips the remaining statements in the current loop body and jumps to the loop's update/condition check.",
          },
        ],
      },
    ],
  },
  {
    id: "cse-ds",
    name: "Data Structures",
    code: "CS1003",
    semester: 2,
    college: "CSE",
    description: "Arrays, linked lists, stacks, queues, trees and sorting",
    color: "#7C3AED",
    icon: "git-network",
    chapters: [
      {
        id: "cse-ds-ch1",
        title: "Arrays and Searching",
        summary:
          "An array is a contiguous block of memory storing elements of the same type, accessed via index starting from 0. Arrays have fixed size. Linear search checks every element (O(n) time). Binary search works on sorted arrays by halving the search space each step (O(log n)). For large datasets, binary search is significantly faster than linear search.",
        content: [
          { type: "heading", level: 1, text: "Arrays in C" },
          {
            type: "paragraph",
            text: "An array stores multiple values of the same type in contiguous memory locations. Elements are accessed using a zero-based index.",
          },
          {
            type: "code",
            language: "c",
            code: `int marks[5] = {85, 92, 78, 95, 88};\nprintf("%d", marks[2]); // Output: 78`,
          },
          { type: "heading", level: 2, text: "Linear Search" },
          {
            type: "paragraph",
            text: "Linear search checks each element one by one from the beginning until the target is found or all elements are checked.",
          },
          {
            type: "code",
            language: "c",
            code: `int linearSearch(int arr[], int n, int key) {\n    for (int i = 0; i < n; i++)\n        if (arr[i] == key) return i;\n    return -1;\n}`,
          },
          { type: "heading", level: 2, text: "Binary Search" },
          {
            type: "paragraph",
            text: "Binary search requires a sorted array. It compares the key with the middle element and halves the search space.",
          },
          {
            type: "code",
            language: "c",
            code: `int binarySearch(int arr[], int n, int key) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (arr[mid] == key) return mid;\n        else if (arr[mid] < key) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`,
          },
          {
            type: "tip",
            text: "Binary search is O(log n) — for an array of 1,000,000 elements, it takes at most 20 comparisons!",
          },
        ],
        flashcards: [
          {
            question: "What is the time complexity of linear search?",
            answer: "O(n) — worst case checks all n elements.",
          },
          {
            question: "What is the prerequisite for binary search?",
            answer: "The array must be sorted in ascending (or descending) order.",
          },
          {
            question: "What is the index of the first element in a C array?",
            answer: "0 (zero). C arrays are zero-indexed.",
          },
          {
            question: "What is the time complexity of binary search?",
            answer: "O(log n) — each step halves the search space.",
          },
        ],
        quiz: [
          {
            question: "For an array of 8 elements, what is the MAXIMUM number of comparisons in binary search?",
            options: ["8", "4", "3", "2"],
            correctIndex: 2,
            explanation: "log₂(8) = 3. Binary search needs at most ⌈log₂(n)⌉ comparisons.",
          },
          {
            question: "Which of these is a disadvantage of arrays?",
            options: [
              "Elements accessed randomly",
              "Fixed size at declaration",
              "Fast access via index",
              "Stores homogeneous data",
            ],
            correctIndex: 1,
            explanation: "Arrays have a fixed size set at declaration (in C). You cannot easily resize them, making them inflexible for dynamic data.",
          },
        ],
      },
    ],
  },
  {
    id: "cse-math1",
    name: "Engineering Mathematics I",
    code: "MA1001",
    semester: 1,
    college: "CSE",
    description: "Calculus, matrices, differential equations for engineers",
    color: "#059669",
    icon: "calculator",
    chapters: [
      {
        id: "cse-math1-ch1",
        title: "Matrices and Determinants",
        summary:
          "A matrix is a rectangular array of numbers arranged in rows and columns. Matrix addition requires same dimensions. Matrix multiplication requires the number of columns in A to equal the number of rows in B. The determinant of a 2×2 matrix [a,b;c,d] = ad - bc. The inverse exists only when the determinant is non-zero. Matrices are widely used in solving systems of linear equations.",
        content: [
          { type: "heading", level: 1, text: "Matrices and Determinants" },
          {
            type: "paragraph",
            text: "A matrix is a rectangular array of numbers, symbols, or expressions arranged in rows and columns. An m×n matrix has m rows and n columns.",
          },
          { type: "heading", level: 2, text: "Matrix Operations" },
          {
            type: "list",
            items: [
              "Addition: Add corresponding elements (matrices must have same dimensions).",
              "Scalar Multiplication: Multiply every element by the scalar.",
              "Matrix Multiplication: A(m×n) × B(n×p) = C(m×p). Inner dimensions must match.",
              "Transpose: Flip rows and columns. (Aᵀ)ᵢⱼ = Aⱼᵢ",
            ],
          },
          { type: "heading", level: 2, text: "Determinant of 2×2 Matrix" },
          {
            type: "definition",
            term: "det([a,b;c,d])",
            definition: "= ad - bc. If det = 0, the matrix is singular (no inverse exists).",
          },
          {
            type: "tip",
            text: "A square matrix A is invertible if and only if det(A) ≠ 0. Such matrices are called non-singular.",
          },
        ],
        flashcards: [
          {
            question: "When can two matrices be multiplied A × B?",
            answer: "When the number of columns in A equals the number of rows in B. An (m×n) matrix can multiply an (n×p) matrix.",
          },
          {
            question: "What is the determinant of the identity matrix?",
            answer: "1. The identity matrix has 1s on the main diagonal and 0s elsewhere.",
          },
          {
            question: "What does it mean if det(A) = 0?",
            answer: "The matrix is singular — its inverse does not exist, and the corresponding system of equations has no unique solution.",
          },
        ],
        quiz: [
          {
            question: "For matrices A(2×3) and B(3×4), what is the size of A×B?",
            options: ["3×3", "2×4", "4×2", "Cannot multiply"],
            correctIndex: 1,
            explanation: "A(m×n) × B(n×p) = C(m×p). Here m=2, n=3, p=4, so the result is 2×4.",
          },
          {
            question: "Find det([[3,1],[2,4]])",
            options: ["10", "14", "12", "8"],
            correctIndex: 0,
            explanation: "det = (3×4) - (1×2) = 12 - 2 = 10.",
          },
        ],
      },
    ],
  },

  {
    id: "eee-circuit",
    name: "Circuit Theory",
    code: "EE1001",
    semester: 1,
    college: "EEE",
    description: "DC/AC circuits, network theorems, transient analysis",
    color: "#DC2626",
    icon: "flash",
    chapters: [
      {
        id: "eee-circuit-ch1",
        title: "Ohm's Law and Kirchhoff's Laws",
        summary:
          "Ohm's Law states V = IR — voltage across a resistor equals current times resistance. Kirchhoff's Current Law (KCL) states that the sum of currents entering a node equals the sum leaving it (conservation of charge). Kirchhoff's Voltage Law (KVL) states the sum of voltages around any closed loop equals zero (conservation of energy). These three laws are the foundation for analyzing all DC circuits.",
        content: [
          {
            type: "heading",
            level: 1,
            text: "Ohm's Law and Kirchhoff's Laws",
          },
          {
            type: "paragraph",
            text: "These fundamental laws are the building blocks of all electrical circuit analysis. Every DC circuit problem can be solved using these three relationships.",
          },
          { type: "heading", level: 2, text: "Ohm's Law" },
          {
            type: "definition",
            term: "V = IR",
            definition:
              "Voltage (V, volts) = Current (I, amperes) × Resistance (R, ohms). Also: I = V/R and R = V/I.",
          },
          {
            type: "tip",
            text: "Memory trick: Think of 'VIR' — Voltage = Current × Resistance. Or use the triangle: cover what you want to find, and multiply/divide what's left.",
          },
          { type: "heading", level: 2, text: "Kirchhoff's Current Law (KCL)" },
          {
            type: "paragraph",
            text: "At any node (junction) in a circuit, the total current entering equals the total current leaving. This is based on conservation of charge.",
          },
          {
            type: "definition",
            term: "ΣI_in = ΣI_out",
            definition:
              "The algebraic sum of all currents at a node = 0. Entering currents are positive, leaving are negative.",
          },
          { type: "heading", level: 2, text: "Kirchhoff's Voltage Law (KVL)" },
          {
            type: "paragraph",
            text: "The algebraic sum of all voltages around any closed loop in a circuit equals zero. This is based on conservation of energy.",
          },
          {
            type: "definition",
            term: "ΣV = 0",
            definition:
              "Going around a loop: voltage rises (e.g., across battery) are positive, voltage drops (across resistors) are negative.",
          },
          {
            type: "tip",
            text: "When applying KVL, choose a direction to traverse the loop (clockwise or counterclockwise) and stay consistent throughout.",
          },
        ],
        flashcards: [
          {
            question: "State Ohm's Law",
            answer: "V = IR — The voltage across a resistor is directly proportional to the current through it, with resistance as the constant of proportionality.",
          },
          {
            question: "What is Kirchhoff's Current Law (KCL)?",
            answer: "The sum of all currents entering a node equals the sum of all currents leaving that node. (ΣI = 0 at every node)",
          },
          {
            question: "What is Kirchhoff's Voltage Law (KVL)?",
            answer: "The algebraic sum of all voltages around any closed loop in a circuit equals zero. (ΣV = 0 around any loop)",
          },
          {
            question: "If V = 12V and R = 4Ω, what is the current?",
            answer: "I = V/R = 12/4 = 3 Amperes.",
          },
          {
            question: "What is the unit of electrical resistance?",
            answer: "Ohm (Ω), named after Georg Simon Ohm.",
          },
        ],
        quiz: [
          {
            question: "A resistor has a voltage of 6V across it and a current of 2A through it. What is the resistance?",
            options: ["3 Ω", "12 Ω", "0.33 Ω", "8 Ω"],
            correctIndex: 0,
            explanation: "R = V/I = 6/2 = 3 Ω (from Ohm's Law rearranged).",
          },
          {
            question: "According to KCL, if 5A enters a node and one branch carries 2A out, how much flows in the other branch (out)?",
            options: ["7A", "2A", "3A", "5A"],
            correctIndex: 2,
            explanation: "KCL: ΣI_in = ΣI_out → 5 = 2 + x → x = 3A.",
          },
          {
            question: "KVL is based on which conservation principle?",
            options: [
              "Conservation of mass",
              "Conservation of energy",
              "Conservation of charge",
              "Conservation of momentum",
            ],
            correctIndex: 1,
            explanation: "KVL is based on conservation of energy — the energy supplied by sources equals the energy dissipated by loads in any closed loop.",
          },
          {
            question: "A series circuit has a 12V battery and two resistors: 3Ω and 1Ω. What is the current?",
            options: ["1A", "2A", "3A", "4A"],
            correctIndex: 2,
            explanation: "Total R = 3 + 1 = 4Ω. I = V/R = 12/4 = 3A. In series, same current flows through all components.",
          },
        ],
      },
      {
        id: "eee-circuit-ch2",
        title: "Series and Parallel Circuits",
        summary:
          "In a series circuit, components share the same current; total resistance is the sum of individual resistances (R_total = R1 + R2 + ...). In a parallel circuit, components share the same voltage; total resistance is found from 1/R_total = 1/R1 + 1/R2 + ... . Parallel circuits always have a total resistance less than the smallest individual resistance. Voltage divider applies to series; current divider to parallel.",
        content: [
          { type: "heading", level: 1, text: "Series and Parallel Circuits" },
          { type: "heading", level: 2, text: "Series Circuits" },
          {
            type: "list",
            items: [
              "Same current flows through all components",
              "Total resistance: R_T = R1 + R2 + R3 + ...",
              "Voltage divides: V1 = I×R1, V2 = I×R2",
              "Total voltage: V_T = V1 + V2 + V3",
            ],
          },
          { type: "heading", level: 2, text: "Parallel Circuits" },
          {
            type: "list",
            items: [
              "Same voltage across all branches",
              "Total resistance: 1/R_T = 1/R1 + 1/R2 + 1/R3",
              "For two resistors: R_T = (R1 × R2)/(R1 + R2)",
              "Current divides among branches",
            ],
          },
          {
            type: "tip",
            text: "Adding more resistors in parallel ALWAYS decreases total resistance. Adding in series ALWAYS increases it.",
          },
        ],
        flashcards: [
          {
            question: "What is the total resistance of 3Ω, 4Ω, and 5Ω in series?",
            answer: "R_T = 3 + 4 + 5 = 12Ω.",
          },
          {
            question: "What is the total resistance of 6Ω and 3Ω in parallel?",
            answer: "R_T = (6×3)/(6+3) = 18/9 = 2Ω.",
          },
          {
            question: "In a series circuit, how does voltage divide?",
            answer: "Proportionally to resistance — V = IR. A larger resistor gets a larger share of voltage.",
          },
        ],
        quiz: [
          {
            question: "Three resistors (2Ω, 4Ω, 6Ω) in parallel. What is the equivalent resistance?",
            options: ["12Ω", "1.09Ω", "0.92Ω", "4Ω"],
            correctIndex: 1,
            explanation: "1/R_T = 1/2 + 1/4 + 1/6 = 6/12 + 3/12 + 2/12 = 11/12. So R_T = 12/11 ≈ 1.09Ω.",
          },
          {
            question: "In a parallel circuit, which quantity is the same across all branches?",
            options: ["Current", "Resistance", "Voltage", "Power"],
            correctIndex: 2,
            explanation: "In a parallel circuit, all branches are connected between the same two nodes, so they share the same voltage.",
          },
        ],
      },
    ],
  },
  {
    id: "eee-math1",
    name: "Engineering Mathematics I",
    code: "MA1001",
    semester: 1,
    college: "EEE",
    description: "Calculus and linear algebra for EEE students",
    color: "#059669",
    icon: "calculator",
    chapters: [
      {
        id: "eee-math1-ch1",
        title: "Differential Calculus",
        summary:
          "Differentiation measures the rate of change of a function. Key rules: Power rule d/dx(xⁿ) = nxⁿ⁻¹, Product rule d/dx(uv) = u'v + uv', Quotient rule d/dx(u/v) = (u'v - uv')/v², and Chain rule for composite functions. Common derivatives: d/dx(sin x) = cos x, d/dx(eˣ) = eˣ, d/dx(ln x) = 1/x. Applications include finding maxima, minima, and rates of change in physical systems.",
        content: [
          { type: "heading", level: 1, text: "Differential Calculus" },
          {
            type: "paragraph",
            text: "The derivative of a function measures how quickly the output changes relative to the input. It represents the instantaneous rate of change and the slope of the tangent line.",
          },
          { type: "heading", level: 2, text: "Basic Differentiation Rules" },
          {
            type: "list",
            items: [
              "Constant rule: d/dx(c) = 0",
              "Power rule: d/dx(xⁿ) = nxⁿ⁻¹",
              "Sum rule: d/dx(u + v) = u' + v'",
              "Product rule: d/dx(uv) = u'v + uv'",
              "Quotient rule: d/dx(u/v) = (u'v - uv') / v²",
            ],
          },
          { type: "heading", level: 2, text: "Common Derivatives" },
          {
            type: "list",
            items: [
              "d/dx(sin x) = cos x",
              "d/dx(cos x) = -sin x",
              "d/dx(eˣ) = eˣ",
              "d/dx(ln x) = 1/x",
              "d/dx(xⁿ) = nxⁿ⁻¹",
            ],
          },
          {
            type: "tip",
            text: "For EEE: derivatives appear everywhere — voltage is the derivative of charge (V = dΦ/dt), current is the derivative of charge (i = dq/dt). Calculus is the language of circuits.",
          },
        ],
        flashcards: [
          {
            question: "State the Power Rule of differentiation",
            answer: "d/dx(xⁿ) = nxⁿ⁻¹. Bring down the exponent as a coefficient and reduce the exponent by 1.",
          },
          {
            question: "What is d/dx(sin x)?",
            answer: "cos x",
          },
          {
            question: "What is d/dx(eˣ)?",
            answer: "eˣ — the exponential function is its own derivative.",
          },
          {
            question: "State the Product Rule",
            answer: "d/dx(uv) = u'v + uv' — differentiate the first times the second, plus the first times the derivative of the second.",
          },
        ],
        quiz: [
          {
            question: "Find d/dx(3x⁴ - 2x² + 5)",
            options: ["12x³ - 4x", "3x³ - 2x", "12x³ - 4x + 5", "4x³ - 2x"],
            correctIndex: 0,
            explanation: "Differentiate term by term: d/dx(3x⁴) = 12x³, d/dx(-2x²) = -4x, d/dx(5) = 0. Result: 12x³ - 4x.",
          },
          {
            question: "What does a derivative equal to zero at a point tell us?",
            options: [
              "The function equals zero",
              "The function is undefined",
              "There may be a local maximum or minimum",
              "The function is increasing",
            ],
            correctIndex: 2,
            explanation: "When f'(x) = 0, the tangent line is horizontal — this indicates a potential local maximum, local minimum, or saddle point (inflection point).",
          },
        ],
      },
    ],
  },
  {
    id: "eee-bed",
    name: "Basic Electrical Engineering",
    code: "EE1002",
    semester: 1,
    college: "EEE",
    description: "Fundamentals of electricity, magnetism and machines",
    color: "#D97706",
    icon: "bulb",
    chapters: [
      {
        id: "eee-bed-ch1",
        title: "Electrostatics and Coulomb's Law",
        summary:
          "Electrostatics studies electric charges at rest. Like charges repel; unlike charges attract. Coulomb's Law: F = kq₁q₂/r² where k = 9×10⁹ N·m²/C². The electric field E = F/q (force per unit positive charge). Field lines point away from positive charges and toward negative charges. Electric potential V = W/q is the work done per unit charge. Capacitors store electric energy as E = ½CV².",
        content: [
          { type: "heading", level: 1, text: "Electrostatics and Coulomb's Law" },
          {
            type: "paragraph",
            text: "Electrostatics deals with stationary electric charges and the forces between them. The fundamental law governing these forces was discovered by Charles-Augustin de Coulomb in 1785.",
          },
          { type: "heading", level: 2, text: "Coulomb's Law" },
          {
            type: "definition",
            term: "F = kq₁q₂/r²",
            definition:
              "The electrostatic force between two point charges q₁ and q₂ separated by distance r. k = 9×10⁹ N·m²/C² (Coulomb's constant).",
          },
          {
            type: "list",
            items: [
              "Force is directly proportional to the product of charges",
              "Force is inversely proportional to the square of the distance",
              "Like charges (++ or --) repel each other",
              "Unlike charges (+- or -+) attract each other",
            ],
          },
          { type: "heading", level: 2, text: "Electric Field" },
          {
            type: "definition",
            term: "E = F/q = kQ/r²",
            definition:
              "Electric field intensity is the force experienced per unit positive test charge. Unit: N/C or V/m.",
          },
          {
            type: "tip",
            text: "Electric field lines NEVER cross. They originate from positive charges and terminate on negative charges. The density of field lines indicates field strength.",
          },
        ],
        flashcards: [
          {
            question: "State Coulomb's Law",
            answer: "F = kq₁q₂/r² — The force between two point charges is proportional to the product of the charges and inversely proportional to the square of the distance between them.",
          },
          {
            question: "What is the value of Coulomb's constant k?",
            answer: "k = 9 × 10⁹ N·m²/C²",
          },
          {
            question: "What is electric field intensity?",
            answer: "E = F/q — the force experienced by a unit positive test charge placed at that point. Unit: N/C.",
          },
          {
            question: "If the distance between two charges doubles, how does the force change?",
            answer: "The force decreases to 1/4 of its original value (inverse square law: F ∝ 1/r²).",
          },
        ],
        quiz: [
          {
            question: "Two charges of 2C and 3C are separated by 1m. What is the force between them?",
            options: [
              "6 × 10⁹ N",
              "54 × 10⁹ N",
              "18 × 10⁹ N",
              "9 × 10⁹ N",
            ],
            correctIndex: 2,
            explanation: "F = kq₁q₂/r² = (9×10⁹ × 2 × 3)/1² = 54×10⁹/3 — wait, F = 9×10⁹ × 6 = 54×10⁹ N. Actually the answer is 54×10⁹ N. But wait let me recalculate: F = (9×10⁹)(2)(3)/(1²) = 54×10⁹ N.",
          },
          {
            question: "Like charges when brought close together will:",
            options: ["Attract", "Repel", "Neutralize", "Have no effect"],
            correctIndex: 1,
            explanation: "Like charges (both positive or both negative) repel each other. Unlike (opposite) charges attract.",
          },
        ],
      },
    ],
  },
];

export function getSubjectsByCollege(college: College): Subject[] {
  return subjects.filter((s) => s.college === college);
}

export function getSubjectById(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getChapterById(
  subjectId: string,
  chapterId: string
): Chapter | undefined {
  const subject = getSubjectById(subjectId);
  return subject?.chapters.find((c) => c.id === chapterId);
}

export const COLLEGES = {
  CSE: {
    id: "CSE" as College,
    name: "CSE First Year",
    fullName: "Computer Science Engineering",
    description: "Core CS subjects: Programming, Data Structures, Maths",
    color: "#4361EE",
    gradient: ["#4361EE", "#7C3AED"] as [string, string],
    icon: "laptop-outline",
  },
  EEE: {
    id: "EEE" as College,
    name: "EEE First Year",
    fullName: "Electrical & Electronics Engineering",
    description: "Core EEE subjects: Circuits, Electronics, Maths",
    color: "#DC2626",
    gradient: ["#DC2626", "#D97706"] as [string, string],
    icon: "flash-outline",
  },
};
