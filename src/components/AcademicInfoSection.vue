<template>
    <div class="flat-shadow" id="academic-info">
        <b-row>
            <b-col cols="3">
                <b v-if="isStudent">Admitted to program</b>
                <b v-else>Students</b>
                <br>
                <span>{{ admittedToProgram }}</span>
            </b-col>
            <b-col cols="3">
                <b v-if="isStudent">GPA</b>
                <b v-else>Average GPA</b>
                <br>
                <span>{{ gpa }}</span>
            </b-col>
            <b-col cols="3">
                <b v-if="isStudent">Attempted Credit Hours</b>
                <b v-else>Average Credit Hours</b>
                <br>
                <span>{{ attemptedCreditHours }}</span>
            </b-col>
            <b-col cols="3">
                <b v-if="isStudent">Total Credit Hours Needed</b>
                <b v-else>Average Credit Hours</b>
                <br>
                <span>{{ totalCreditsNeeded }}</span>
            </b-col>
            <b-col cols="3">
                <b v-if="isStudent">Completion</b>
                <b v-else>Average Completion</b>
                <br>
                <span>{{ completion }}%</span>
            </b-col>
        </b-row>
    </div>
</template>

<script>
export default {
    name: "AcademicInfoSection",
    props: {
        isStudent: {
            type: Boolean,
            default: true
        },
        info: {
            type: Object,
            required:true
        }
    },
    data() {
        return {
            admittedToProgram: this.info.admittedToProgram,
            gpa: this.info.GPA,
            attemptedCreditHours: this.info.attemptedCreditHours,
            totalCreditsNeeded: this.info.totalCreditsNeeded,
            completion: parseFloat(this.info.completion) * 100
        }
    }
}
</script>

<style scoped>
#academic-info {
	/* color: #777; */
	text-align: center;
}

#academic-info b {
  font-size: 12px;
  text-transform: uppercase;
}

#academic-info span {
  font-size: 28px;
  font-weight: 100;
}
</style>