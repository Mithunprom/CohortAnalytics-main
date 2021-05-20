<template>
  <div>
    <basic-info-section v-bind:is-student="false" />
      
    <academic-info-section v-bind:is-student="false" />

    <summary-info-section  />
    
    <histogram />

    <b-row>
      <b-col cols="6">
        <pie-chart />
      </b-col>
      <b-col cols="6">
        <course-table />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import AcademicInfoSection from '../components/AcademicInfoSection'
import BasicInfoSection from '../components/BasicInfoSection'
import CourseTable from '../components/CourseTable'
import Histogram from '../components/Histogram'
import PieChart from '../components/PieChart'
import SummaryInfoSection from '../components/SummaryInfoSection'

export default {
    name: "CohortView",
    components: { 
      BasicInfoSection, 
      AcademicInfoSection, 
      SummaryInfoSection, 
      Histogram, 
      PieChart, 
      CourseTable },
}
</script>

<style scoped>

</style>