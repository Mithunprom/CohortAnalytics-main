<template>
  <div>
      <basic-info-section v-bind:info="basicInfo"/>
      <academic-info-section v-bind:info="academicInfo"/>
      
      <summary-info-section v-bind:info="summaryInfo"/>

      <requirement-list title="Requirements completed" type="RC" v-bind:requirements="reqCompleted" />
      <requirement-list title="Requirements not completed" type="RNC" v-bind:requirements="reqNotCompeleted" />
      <requirement-list title="Courses not counted" type="CNC" v-bind:courses="coursesNotCounted" />
      <requirement-list title="Courses Dropped" type="DNC" v-bind:requirements="courseDropped" />
  </div>
</template>

<script>
// import { mapGetters } from "vuex";
import AcademicInfoSection from '../components/AcademicInfoSection'
import BasicInfoSection from '../components/BasicInfoSection'
import RequirementList from "../components/RequirementList"
import SummaryInfoSection from '../components/SummaryInfoSection'

export default {
  name: "StudentView",
  components: { BasicInfoSection, AcademicInfoSection, RequirementList, SummaryInfoSection },
  data() {
    
    const student = this.$store.getters.studentWithId(this.$route.params.id);
    const {reqCompleted, reqNotCompeleted, coursesNotCounted, courseDropped,
          studentID, major, minor, concentration, attemptedCreditHours,totalCreditsNeeded,
          admittedToProgram, GPA, completion, efficiencyRating,
          creditsCountedTowardsDegree, creditsNotCountedTowardsDegree} = student;
    return {
      basicInfo: {studentID, major, minor, concentration},
      academicInfo: {admittedToProgram, GPA, completion, attemptedCreditHours,totalCreditsNeeded},
      summaryInfo: {efficiencyRating, creditsCountedTowardsDegree, creditsNotCountedTowardsDegree},
      reqCompleted, reqNotCompeleted, coursesNotCounted,courseDropped
    }
  }
}
</script>

<style scoped>

</style>