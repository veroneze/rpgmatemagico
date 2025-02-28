import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";

const MathGame = () => {
  const worlds = {
    addition: { name: "Addition World", symbol: "+" },
    subtraction: { name: "Subtraction World", symbol: "-" },
    multiplication: { name: "Multiplication World", symbol: "×" },
    division: { name: "Division World", symbol: "÷" },
    boss: { name: "Boss Battle", symbol: "☠" },
  };

  const [gameState, setGameState] = useState({
    currentWorld: "addition",
    grid: [],
    xp: {
      addition: 0,
      subtraction: 0,
      multiplication: 0,
      division: 0,
    },
    battleMode: false,
    currentEnemy: null,
    currentQuestion: null,
    answer: "",
    questions: [],
    questionIndex: 0,
    numberRange: { min: 1, max: 10 },
    worldsCompleted: 0,
    bonusSquares: [],
    worldProgress: {},
    bossUnlocked: false,
    isBossBattle: false,
  });

  useEffect(() => {
    initializeGrid();
  }, [gameState.currentWorld, gameState.numberRange]);

  const initializeGrid = () => {
    if (gameState.currentWorld === "boss") return;

    const newGrid = Array(5)
      .fill(null)
      .map(() => Array(5).fill(null));
    const { min, max } = gameState.numberRange;
    const availableNumbers = Array.from(
      { length: max - min + 1 },
      (_, i) => i + min,
    );

    // Posicionar 10 números aleatoriamente
    for (let i = 0; i < 10; i++) {
      let placed = false;
      while (!placed) {
        const row = Math.floor(Math.random() * 5);
        const col = Math.floor(Math.random() * 5);
        if (!newGrid[row][col]) {
          newGrid[row][col] = {
            base: availableNumbers[i],
            defeated: false,
            isBonus: false,
          };
          placed = true;
        }
      }
    }

    // Adicionar bônus em 2 quadrados aleatórios
    let bonusCount = 0;
    const bonusSquares = [];
    while (bonusCount < 2) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      if (newGrid[row][col] && !newGrid[row][col].isBonus) {
        newGrid[row][col].isBonus = true;
        bonusSquares.push({ row, col });
        bonusCount++;
      }
    }

    setGameState((prev) => ({
      ...prev,
      grid: newGrid,
      bonusSquares,
      worldProgress: {
        ...prev.worldProgress,
        [prev.currentWorld]: false,
      },
    }));
  };

  const generateQuestions = (enemyBase, isBoss = false) => {
    if (isBoss) {
      const operations = [
        "addition",
        "subtraction",
        "multiplication",
        "division",
      ];
      const allQuestions = [];

      // Gerar todas as possíveis perguntas para o chefão
      operations.forEach((operation) => {
        const questions = generateQuestionsForOperation(enemyBase, operation);
        allQuestions.push(...questions);
      });

      // Embaralhar e selecionar 10 perguntas únicas
      return shuffleArray(allQuestions).slice(0, 10);
    }

    // Para mundos normais, gerar perguntas específicas da operação
    return generateQuestionsForOperation(enemyBase, gameState.currentWorld);
  };

  const generateQuestionsForOperation = (base, operation) => {
    const { min, max } = gameState.numberRange;
    const questions = new Set(); // Usar Set para garantir unicidade

    switch (operation) {
      case "addition": {
        // Gerar todas as possíveis somas com números no range
        for (let i = min; i <= max; i++) {
          questions.add({
            question: `${base} + ${i} = ?`,
            answer: base + i,
          });
        }
        break;
      }

      case "subtraction": {
        // Gerar subtrações que resultam em números positivos
        for (let i = 0; i <= base; i++) {
          questions.add({
            question: `${base} - ${i} = ?`,
            answer: base - i,
          });
        }
        break;
      }

      case "multiplication": {
        // Gerar todas as multiplicações possíveis no range
        for (let i = min; i <= max; i++) {
          questions.add({
            question: `${base} × ${i} = ?`,
            answer: base * i,
          });
        }
        break;
      }

      case "division": {
        // Gerar divisões que resultam em números inteiros
        for (let i = min; i <= max; i++) {
          if (base % i === 0) {
            questions.add({
              question: `${base} ÷ ${i} = ?`,
              answer: base / i,
            });
          }
        }
        // Se não houver divisões exatas suficientes, adicionar multiplicações inversas
        if (questions.size < 5) {
          for (let i = min; i <= max; i++) {
            questions.add({
              question: `${base * i} ÷ ${i} = ?`,
              answer: base,
            });
          }
        }
        break;
      }
    }

    // Converter Set para Array e embaralhar
    return shuffleArray(Array.from(questions)).slice(0, 10);
  };

  // Função auxiliar para embaralhar array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateQuestionForOperation = (base, operation) => {
    const { min, max } = gameState.numberRange;
    switch (operation) {
      case "addition":
        const addend = Math.floor(Math.random() * (max - min + 1) + min);
        return {
          question: `${base} + ${addend} = ?`,
          answer: base + addend,
        };
      case "subtraction":
        const subtrahend = Math.floor(Math.random() * base);
        return {
          question: `${base} - ${subtrahend} = ?`,
          answer: base - subtrahend,
        };
      case "multiplication":
        const multiplier = Math.floor(Math.random() * (max - min + 1) + min);
        return {
          question: `${base} × ${multiplier} = ?`,
          answer: base * multiplier,
        };
      case "division":
        const divisor = Math.floor(Math.random() * (max - min + 1) + min);
        return {
          question: `${base * divisor} ÷ ${divisor} = ?`,
          answer: base,
        };
      default:
        return null;
    }
  };

  const handleSquarePress = (row, col) => {
    const enemy = gameState.grid[row][col];
    if (enemy && !enemy.defeated) {
      const questions = generateQuestions(enemy.base, gameState.isBossBattle);
      setGameState((prev) => ({
        ...prev,
        battleMode: true,
        currentEnemy: { row, col, base: enemy.base, isBonus: enemy.isBonus },
        questions,
        questionIndex: 0,
        currentQuestion: questions[0],
        answer: "",
      }));
    }
  };

  const checkWorldCompletion = () => {
    const allDefeated = gameState.grid.every((row) =>
      row.every((cell) => !cell || cell.defeated),
    );

    if (allDefeated) {
      const allWorldsComplete = Object.keys(worlds)
        .filter((w) => w !== "boss")
        .every((world) => gameState.worldProgress[world]);

      if (allWorldsComplete && !gameState.bossUnlocked) {
        Alert.alert(
          "Boss Battle Unlocked!",
          "Defeat the boss to advance to the next level!",
        );
        setGameState((prev) => ({ ...prev, bossUnlocked: true }));
      }
    }

    return allDefeated;
  };

  const handleAnswerSubmit = () => {
    const { currentQuestion, questionIndex, questions, currentEnemy } =
      gameState;
    const numAnswer = parseInt(gameState.answer);

    if (numAnswer === currentQuestion.answer) {
      if (questionIndex === questions.length - 1) {
        // Battle won
        const newGrid = [...gameState.grid];
        newGrid[currentEnemy.row][currentEnemy.col].defeated = true;

        const xpGain = currentEnemy.isBonus ? 20 : 10;
        const newXP = { ...gameState.xp };
        newXP[gameState.currentWorld] += xpGain;

        if (currentEnemy.isBonus) {
          Alert.alert("Bonus Square!", `You found a bonus square! +${xpGain} XP!`);
        }

        const newState = {
          ...gameState,
          grid: newGrid,
          battleMode: false,
          xp: newXP,
        };

        if (checkWorldCompletion()) {
          if (gameState.isBossBattle) {
            // Avançar para próximo nível de números
            const newRange = {
              min: gameState.numberRange.min + 10,
              max: gameState.numberRange.max + 10,
            };
            Alert.alert(
              "Congratulations!",
              `You've completed all worlds and defeated the boss! Moving to numbers ${newRange.min}-${newRange.max}!`
            );
            newState.numberRange = newRange;
            newState.worldsCompleted++;
            newState.bossUnlocked = false;
            newState.isBossBattle = false;
            newState.currentWorld = "addition";
          } else {
            Alert.alert("World Complete!", "Move to the next world!");
          }
        }

        setGameState(newState);
      } else {
        // Next question
        setGameState((prev) => ({
          ...prev,
          questionIndex: prev.questionIndex + 1,
          currentQuestion: questions[questionIndex + 1],
          answer: "",
        }));
      }
    } else {
      Alert.alert("Wrong Answer", "Try again!");
      setGameState((prev) => ({ ...prev, answer: "" }));
    }
  };

  const getWorldColor = (world) => {
    const colors = {
      addition: "#4CAF50",
      subtraction: "#2196F3",
      multiplication: "#9C27B0",
      division: "#FF9800",
      boss: "#FF5252",
    };
    return colors[world];
  };

  const WorldSelector = () => (
    <View style={styles.worldSelector}>
      {Object.entries(worlds).map(([worldKey, worldData]) => {
        if (worldKey === "boss" && !gameState.bossUnlocked) return null;
        return (
          <TouchableOpacity
            key={worldKey}
            style={[
              styles.worldButton,
              gameState.currentWorld === worldKey && styles.worldButtonSelected,
              { backgroundColor: getWorldColor(worldKey) },
            ]}
            onPress={() => {
              if (worldKey === "boss") {
                setGameState((prev) => ({
                  ...prev,
                  currentWorld: worldKey,
                  isBossBattle: true,
                }));
              } else {
                setGameState((prev) => ({
                  ...prev,
                  currentWorld: worldKey,
                  isBossBattle: false,
                }));
              }
            }}
          >
            <Text style={styles.worldButtonText}>{worldData.symbol}</Text>
            <Text style={styles.worldButtonSubtext}>
              {worldData.name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <WorldSelector />

        <Text
          style={[
            styles.worldTitle,
            { color: getWorldColor(gameState.currentWorld) },
          ]}
        >
          {worlds[gameState.currentWorld].name}
          {gameState.numberRange.min > 1 &&
            ` (${gameState.numberRange.min}-${gameState.numberRange.max})`}
        </Text>

        <View style={styles.grid}>
          {gameState.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.cell,
                    cell && styles.cellWithEnemy,
                    cell?.defeated && styles.cellDefeated,
                  ]}
                  onPress={() => handleSquarePress(rowIndex, colIndex)}
                  disabled={!cell || cell.defeated}
                />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.xpContainer}>
          <Text style={styles.xpTitle}>World Progress</Text>
          {Object.entries(gameState.xp).map(([world, points]) => (
            <View key={world} style={styles.xpRow}>
              <Text style={styles.xpText}>
                {worlds[world].name}: {points} XP
              </Text>
              <View style={styles.xpBarContainer}>
                <View
                  style={[
                    styles.xpBar,
                    {
                      width: `${Math.min(points, 100)}%`,
                      backgroundColor: getWorldColor(world),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <Modal
          visible={gameState.battleMode}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.battleBox,
                { borderColor: getWorldColor(gameState.currentWorld) },
              ]}
            >
              <Text
                style={[
                  styles.battleWorldTitle,
                  { color: getWorldColor(gameState.currentWorld) },
                ]}
              >
                {worlds[gameState.currentWorld].name}
              </Text>
              <Text style={styles.battleProgress}>
                Question {gameState.questionIndex + 1} of{" "}
                {gameState.questions.length}
              </Text>
              <Text style={styles.questionText}>
                {gameState.currentQuestion?.question}
              </Text>
              <TextInput
                style={styles.answerInput}
                value={gameState.answer}
                onChangeText={(text) =>
                  setGameState((prev) => ({ ...prev, answer: text }))
                }
                keyboardType="numeric"
                autoFocus
                onSubmitEditing={handleAnswerSubmit}
              />
              <View style={styles.battleButtons}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: getWorldColor(gameState.currentWorld) },
                  ]}
                  onPress={handleAnswerSubmit}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={() =>
                    setGameState((prev) => ({ ...prev, battleMode: false }))
                  }
                >
                  <Text style={styles.buttonText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  innerContainer: {
    width: 400,
    padding: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  worldSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  worldButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  worldButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  worldButtonSubtext: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  worldTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  grid: {
    aspectRatio: 1,
    marginVertical: 16,
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    margin: 2,
    backgroundColor: "#f0f0f0",
    aspectRatio: 1,
    borderRadius: 8,
  },
  cellWithEnemy: {
    backgroundColor: "#ffd700",
  },
  cellDefeated: {
    backgroundColor: "#90ee90",
    opacity: 0.5,
  },
  xpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  xpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  xpRow: {
    marginVertical: 4,
  },
  xpText: {
    marginBottom: 4,
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
  },
  xpBar: {
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  battleBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    borderWidth: 2,
  },
  battleWorldTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  battleProgress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  answerInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    width: "100%",
    marginBottom: 16,
    fontSize: 18,
    textAlign: "center",
  },
  battleButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  submitButton: {
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  exitButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MathGame;
