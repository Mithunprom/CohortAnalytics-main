<template>
  <div class="flat-shadow" id="summary-info">
      <span>Efficiency Rating</span>
      <progress-bar />
      <b-row>
          <b-col cols="6">
              <info-item :name="countedName" :value="creditsCounted" />
          </b-col>
          <b-col cols="6">
              <info-item :name="notCountedName" :value="creditsNotCounted" />
          </b-col>
      </b-row>
  </div>
</template>

<script>
import InfoItem from './InfoItem'
import ProgressBar from './ProgressBar'
//import Packchart from './Chart01'

export default {
    name: "SummaryInfoSection",
    components: { InfoItem, ProgressBar },
    props: {
        isStudent: {
            type: Boolean,
            default: true
        },
        info: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            countedName: this.isStudent ? "Credits counted towards degree" : "AVG Credits counted towards degree",
            notCountedName: this.isStudent ? "Credits not counted towards degree" : "AVG Credits not counted towards degree",
            rating: this.info.efficiencyRating,
            creditsCounted: this.info.creditsCountedTowardsDegree.toString(),
            creditsNotCounted: this.info.creditsNotCountedTowardsDegree.toString()
        }
    }
}
</script>

<style scoped>
#summary-info {
    text-align: center;
}

span {
    font-size: 22px;
    text-transform: uppercase;
    font-weight: 100;
}
</style>