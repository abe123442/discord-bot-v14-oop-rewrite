const { MessageActionRow, MessageButton } = require("discord.js");

class QuizStore {
    constructor() {
        this.quizzes = [];
    }
    
    /** 
     * @param {CommandInteraction} interaction
     */
    async createQuiz(interaction) {
        // get title
        const title = interaction.options.get("title").value;

        for (const quiz of this.quizzes) {
            if (quiz.title === title) {
                await interaction.reply({content: "ERROR: Quiz already exists", ephemeral: true});
                return;
            }
        }
    
        this.quizzes.push({
            title: title, 
            questions: [], 
            currQuestion: 0, 
            playerScores: [],
            isActive: false,
            channelId: interaction.channelId
        });
        await interaction.reply({content: `Sucessfully created quiz with title ${title}`, ephemeral: true});
    }

    /** 
     * @param {CommandInteraction} interaction
     */
    async createQuestion(interaction) {
        
        const title = interaction.options.get("quiz-title").value;
        const question = interaction.options.get("question").value;
        const isMultChoice = interaction.options.get("is-mult-choice").value;

        // check if quiz exists, and add question if so
        let quizFound = false; 
        for (const quiz of this.quizzes) {
            if (quiz.title === title) {
                quizFound = true;
                quiz.questions.push({
                    "question": question,
                    "answers" : [],
                    "isMultChoice": isMultChoice,
                    "playerAnswers": [] 
                });
                break;
            }
        }

        if (!quizFound) {
            await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
        } else {
            await interaction.reply({content: `Sucessfully added question to ${title}.`, ephemeral: true});
        }

        return;
    }

    /** 
     * @param {CommandInteraction} interaction
     */
    async createAnswer(interaction) {
        const title = interaction.options.get("quiz-title").value;
        const question = interaction.options.get("question").value;
        const answer = interaction.options.get("answer").value;
        const isCorrect = interaction.options.get("is-correct").value;

        // check if quiz exists
        let quizFound = false; 
        let quiz = null;
        for (const q of this.quizzes) {
            if (q.title === title) {
                quizFound = true;
                quiz = q;
                break;
            }
        }

        if (!quizFound) {
            await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
            return;
        }

        // check if question exists, and add answer if so
        let questionFound = false;
        for (const q of quiz.questions) {
            if (q.question === question) {
                // check if max questions reached
                if (q.answers.length >= 4) {
                    await interaction.reply({content: `Question has 4 answers already! Can't add more.`, ephemeral: true});
                    break;
                }

                // add answer
                q.answers.push({answer: answer, isCorrect: isCorrect});

                questionFound = true;
                break;
            }
        }

        if (!questionFound) {
            await interaction.reply({content: `Question ${question} in quiz ${title} does not exist`, ephemeral: true});
        } else {
            await interaction.reply({content: `Sucessfully added answer to ${question} in quiz ${title}.`, ephemeral: true});
        }

        return;
    }

    /** 
     * @param {CommandInteraction} interaction
     */
    async startQuiz(interaction) {
        // get title
        const title = interaction.options.get("quiz-title").value;

        // check if quiz exists, and add question if so
        let quizFound = false; 
        let quiz = null;
        let quizId = 0;
        for (const q of this.quizzes) {
            if (q.title === title) {
                quizFound = true;
                quiz = q;
                break;
            }
            quizId++;
        }

        if (!quizFound) {
            await interaction.reply({content: `Quiz with title ${title} does not exist`, ephemeral: true});
            return;
        }

        if (quiz.isActive) {
            await interaction.reply({content: `Quiz with title ${title} is already running!`, ephemeral: true});
        }

        quiz.isActive = true; 

        // TODO: further validation?
        await interaction.reply('Starting quiz:');
        await this.nextQuestion(quizId, interaction);
    
        return;
    }

    async nextQuestion(quizId, interaction) {
        let quiz = this.quizzes[quizId];

        // do quiz 
        const row = new MessageActionRow();
        let i = 0;
        for (const answer of quiz.questions[quiz.currQuestion].answers) {
            row.addComponents(
                new MessageButton()
                    .setCustomId('quiz:'+ quizId + ":" + quiz.currQuestion+':'+i)
                    .setLabel(answer.answer)
                    .setStyle('PRIMARY'),
            );
            i++;
        }

        await interaction.editReply({ content: 'Quiz:', components: [row] });

        // 20 sec timeout
        setTimeout(() => {this.displayLeaderboard(quizId, interaction)}, 20000);
    }

    async addPlayerAnswer(interaction) {
        const buttonInfo = interaction.customId.split(":");

        const quizId = buttonInfo[1];
        const questionId = buttonInfo[2];
        const answerId = parseInt(buttonInfo[3]);
        const userId = interaction.user.id; 
        const username = interaction.user.username;
        console.log("Selected button with answer id " + answerId + "\n");

        const isMultChoice = this.quizzes[quizId].questions[questionId].isMultChoice; 

        let question = this.quizzes[quizId].questions[questionId];

        let playerHasAnswered = false;
        let thisPlayerAnswer = null;
        for (const playerAnswer of question.playerAnswers) {
            if (playerAnswer.userId == userId) {
                playerHasAnswered = true;
                if (!isMultChoice) {
                    playerAnswer.answerIds = [answerId];
                } else {
                    thisPlayerAnswer = playerAnswer;
                }
            }
        }

        if (!playerHasAnswered) {
            // add player's answer
            question.playerAnswers.push(
                {answerIds: [answerId], userId: userId, username: username}
            );
        // handle multiple choice quizzes here...
        } else if (isMultChoice) {
            // if they've already selected this answer, remove it...
            if (thisPlayerAnswer.answerIds.includes(answerId)) {
                thisPlayerAnswer.answerIds.remove(answerId);
            } else {
                // else add it 
                thisPlayerAnswer.answerIds.push(answerId);
            }  
        }

        await interaction.reply({
            content: username + " selected answer " + answerId, 
            ephemeral: true
        });
    }

    async displayLeaderboard(quizId, interaction) {
        // re-calc player scores based on answer to current question 
        // to do this, get id(s) of correct question(s) and compare
        // them to the player answer ids 
        const currQuestionId = this.quizzes[quizId].currQuestion;
        const currQuestion = this.quizzes[quizId].questions[currQuestionId];
        const currQuiz = this.quizzes[quizId];
        let correctAnswerIds = [];
        let i = 0;
        for (const ans of currQuestion.answers) {
            if (ans.isCorrect) {
                correctAnswerIds.push(i);
            }
            i++;
        }

        // add points
        for (const playerAnswer of currQuestion.playerAnswers) {
            // length of answers must be the same
            if (playerAnswer.answerIds.length != correctAnswerIds.length) {
                console.log("Wrong len!\n");
                continue;
            }

            // assuming length of answers is the same, we only need 
            // one "wrong" answer for the player to be wrong
            let playerWrong = false;
            // TODO: check logic....
            for (const answerId of correctAnswerIds) {
                if (!playerAnswer.answerIds.includes(answerId)) {
                    console.log("You're incorrect!");
                    console.log(playerAnswer.answerIds);
                    console.log(correctAnswerIds);
                    console.log(answerId);
                    playerWrong = true;
                    break;
                }
            }

            // TODO: make this...look nicer?
            if (!playerWrong) {
                console.log("Player is correct!\n");
                // add points for the question 
                // TODO: stop hardcoding points?
                let playerScoreFound = false; 
                for (let playerScore of currQuiz.playerScores) {
                    if (playerAnswer.userId === playerScore.userId) {
                        playerScore.score += 100;
                        playerScoreFound = true; 
                    }
                }
                // if not score exists, create it
                if (!playerScoreFound) {
                    currQuiz.playerScores.push({
                        userId: playerAnswer.userId, 
                        username: playerAnswer.username,
                        score: 100
                    });
                }
            } else {
                console.log("Player is wrong!\n");
                let playerScoreFound = false; 
                for (let playerScore of currQuiz.playerScores) {
                    if (playerAnswer.userId === playerScore.userId) {
                        playerScoreFound = true; 
                        break;
                    }
                }
                // if not score exists, create it
                if (!playerScoreFound) {
                    currQuiz.playerScores.push({
                        userId: playerAnswer.userId, 
                        username: playerAnswer.username,
                        score: 0
                    });
                }
            }
        }

        // display leadboard 
        let leaderboard = "Leaderboard:\n";
        for (const playerScore of currQuiz.playerScores) {
            leaderboard += playerScore.username + " has " + playerScore.score + " points.\n";
        }
        
        // We can increment the question here, since we're basically done 
        // with this one
        currQuiz.currQuestion++;    

        // if there are still questions to go, continue
        if (currQuiz.currQuestion < currQuiz.questions.length) {
            await interaction.editReply({content: leaderboard, components: []});
            // set 10-second timeout to display next question! 
            setTimeout(() => {this.nextQuestion(quizId, interaction)}, 10000);
        } else {
            leaderboard += "Quiz has completed!\n";
            currQuiz.isActive = false; 
            await interaction.editReply({content: leaderboard, components: []});
        }
        
        
    }

}

module.exports = {QuizStore};