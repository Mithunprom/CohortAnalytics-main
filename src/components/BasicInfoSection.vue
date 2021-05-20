<template>
    <div id="basic-info">
        <b-row v-if="isStudent">
          <b-col cols="6">
            <ul>
                <li><b>STUDENT ID: </b><span>{{ studentID }}</span></li>
                <li><b>MINOR: </b><span>{{ minor }}</span></li>
            </ul>
          </b-col>
          <b-col cols="6">
            <ul>
                <li><b>MAJOR: </b><span>{{ major }}</span></li>
                <li><b>CONCENTRATION: </b><span>{{ concentration }}</span></li>
            </ul>
          </b-col>
        </b-row>
        <h3 v-else>College of Engineering</h3>
      </div>
</template>

<script>
export default {
    name: "BasicInfoSection",
    props: {
        isStudent: {
            type: Boolean,
            default: true
        },
        info: {
            type: Object
        }
    },
    data() {
      return {
        studentID: this.info.studentID,
        minor: this.info.minor,
        major: this.info.major,
        concentration: this.info.concentration,
      }
    }
}
</script>

<style scoped>
#basic-info {
  padding-top: 40px;
	padding-bottom: 8px;
  height: 120px;
}

#basic-info ul {
  list-style-type: none;
}

#basic-info li {
  margin-bottom: 10px;
}
</style>