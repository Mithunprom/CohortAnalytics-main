<template>
    <div id="requirement-list">
        <h4>{{ title }}</h4>
        <b-row>
            <b-col cols="6" v-for="i in [0, 1]" v-bind:key="i">
            <ul>
                <li v-for="requirement in reqsSplit(i)" v-bind:key="requirement">
                    <b-icon v-if="type === 'RC'" icon="check-circle-fill" variant="success"></b-icon>
                    <b-icon v-else-if="type === 'RNC'" icon="exclamation-circle-fill" variant="warning"></b-icon>
                    <b-icon v-else-if="type === 'CNC'" icon="x-circle-fill" variant="danger"></b-icon>
                    <b-icon v-else-if="type === 'DNC'" icon="exclamation-circle-fill" variant="warning"></b-icon>
                    <span v-if="type !== 'CNC'">{{ requirement }}</span>
                    <span v-else>{{ requirement.name }}: {{ requirement.grade }}<span class="right">{{ requirement.note }}</span></span>
                </li>
            </ul>
            </b-col>
        </b-row>
    </div>
</template>

<script>
export default {
    name: "RequirementList",
    props: {
        title: {
            type: String
        },
        type: {
            type: String
        },
        requirements: {
            type: Array
        },
        courses: {
            type: Array
        }
    },
    methods: {
        reqsSplit: function (n) {
            
            if (this.type === "CNC" && this.courses === undefined) return [];

            if (this.type !== "CNC" && this.requirements === undefined) return [];
            
            let res = [];
            const items = this.type === "CNC" ? this.courses : this.requirements;
            items.forEach((r, i) => {
                if (i % 2 === n) {
                    this.type === "CNC" ? res.push({name: r.name, grade: r.grade, note: r.note}) : res.push(r);
                }
            });
            return res;
        }
    }
}
</script>

<style scoped>
#requirement-list {
  margin-top: 15px;
  padding: 0;
}

#requirement-list h4 {
  margin-bottom: 16px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 22px;
}

#requirement-list ul {
  list-style-type: none;
  padding: 0;
}

#requirement-list li {
  padding: 10px;
  /* padding-right: 0; */
  background-color: white;
  margin-bottom: 5px;
}

#requirement-list span {
  margin-left: 10px;
}

span.right {
    float: right;
}

</style>